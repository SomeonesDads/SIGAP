"""Training pipeline and dataset loader for U-Net burned area segmentation.

Provides:
    - BurnedAreaDataset: PyTorch Dataset for paired multi-band satellite rasters and binary masks.
    - Loss functions: DiceLoss, BCEWithLogitsLoss, and combined BCEDiceLoss.
    - Evaluation metrics: Intersection-over-Union (IoU) and Dice Similarity Coefficient (F1).
    - Training loop skeleton: Epoch iteration, validation, metric logging, and checkpoint saving.
"""

import argparse
import logging
import os
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

from ml.unet.model import UNet

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("SIGAP.ML.Train")


class BurnedAreaDataset(Dataset):
    """PyTorch Dataset for multi-band satellite images and corresponding burned area masks.

    Expects paired files (either .npy or geospatial rasters) representing:
        - Image patches: Shape (C, H, W) or (H, W, C), e.g., 6 channels for Landsat.
        - Mask patches: Shape (1, H, W) or (H, W) where 1 indicates burned, 0 unburned.

    Args:
        data_dir: Path to directory containing 'images' and 'masks' subdirectories,
            or a flat folder with matching file stems.
        image_files: Optional explicit list of image paths.
        mask_files: Optional explicit list of mask paths.
        transform: Optional data augmentation/preprocessing callable.
    """

    def __init__(
        self,
        data_dir: Optional[Union[str, Path]] = None,
        image_files: Optional[List[Union[str, Path]]] = None,
        mask_files: Optional[List[Union[str, Path]]] = None,
        transform: Optional[Callable] = None,
    ) -> None:
        super().__init__()
        self.transform = transform
        self.image_paths: List[Path] = []
        self.mask_paths: List[Path] = []

        if image_files is not None and mask_files is not None:
            self.image_paths = [Path(p) for p in image_files]
            self.mask_paths = [Path(p) for p in mask_files]
        elif data_dir is not None:
            data_path = Path(data_dir)
            images_dir = data_path / "images"
            masks_dir = data_path / "masks"

            if images_dir.exists() and masks_dir.exists():
                self.image_paths = sorted(list(images_dir.glob("*.npy")) + list(images_dir.glob("*.tif")))
                self.mask_paths = sorted(list(masks_dir.glob("*.npy")) + list(masks_dir.glob("*.tif")))
            else:
                # Flat directory fallback
                self.image_paths = sorted(list(data_path.glob("*_img.npy")) + list(data_path.glob("*_img.tif")))
                self.mask_paths = sorted(list(data_path.glob("*_mask.npy")) + list(data_path.glob("*_mask.tif")))
        else:
            raise ValueError("Either (image_files, mask_files) or data_dir must be provided.")

        if len(self.image_paths) != len(self.mask_paths):
            logger.warning(
                "Image count (%d) does not match mask count (%d).",
                len(self.image_paths),
                len(self.mask_paths),
            )

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_path = self.image_paths[idx]
        mask_path = self.mask_paths[idx]

        # Load image
        if img_path.suffix == ".npy":
            image = np.load(img_path).astype(np.float32)
        else:
            try:
                import rasterio
                with rasterio.open(img_path) as src:
                    image = src.read().astype(np.float32)  # (C, H, W)
            except ImportError:
                raise ImportError("rasterio is required to read GeoTIFF files.")

        # Ensure shape (C, H, W)
        if image.ndim == 2:
            image = image[np.newaxis, :, :]
        elif image.ndim == 3 and image.shape[-1] in (3, 6):  # (H, W, C) -> (C, H, W)
            image = np.transpose(image, (2, 0, 1))

        # Load mask
        if mask_path.suffix == ".npy":
            mask = np.load(mask_path).astype(np.float32)
        else:
            try:
                import rasterio
                with rasterio.open(mask_path) as src:
                    mask = src.read(1).astype(np.float32)  # (H, W)
            except ImportError:
                raise ImportError("rasterio is required to read GeoTIFF files.")

        if mask.ndim == 2:
            mask = mask[np.newaxis, :, :]

        # Normalize mask to binary 0.0 or 1.0
        mask = (mask > 0).astype(np.float32)

        image_tensor = torch.from_numpy(image)
        mask_tensor = torch.from_numpy(mask)

        if self.transform is not None:
            image_tensor, mask_tensor = self.transform(image_tensor, mask_tensor)

        return image_tensor, mask_tensor


class DiceLoss(nn.Module):
    """Dice Loss for binary segmentation.

    Defined as: 1 - (2 * |X ∩ Y| + smooth) / (|X| + |Y| + smooth)
    """

    def __init__(self, smooth: float = 1.0) -> None:
        super().__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)

        intersection = (probs_flat * targets_flat).sum()
        total = probs_flat.sum() + targets_flat.sum()

        dice = (2.0 * intersection + self.smooth) / (total + self.smooth)
        return 1.0 - dice


class BCEDiceLoss(nn.Module):
    """Combined Binary Cross Entropy and Dice Loss for burned area segmentation."""

    def __init__(self, bce_weight: float = 0.5, dice_weight: float = 0.5, pos_weight: Optional[float] = None) -> None:
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        pos_weight_tensor = torch.tensor([pos_weight]) if pos_weight is not None else None
        self.bce = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)
        self.dice = DiceLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        bce_loss = self.bce(logits, targets)
        dice_loss = self.dice(logits, targets)
        return self.bce_weight * bce_loss + self.dice_weight * dice_loss


def compute_iou(
    logits_or_probs: torch.Tensor,
    targets: torch.Tensor,
    threshold: float = 0.5,
    eps: float = 1e-7,
) -> float:
    """Compute Intersection-over-Union (Jaccard Index) for binary predictions."""
    with torch.no_grad():
        if logits_or_probs.min() < 0.0 or logits_or_probs.max() > 1.0:
            probs = torch.sigmoid(logits_or_probs)
        else:
            probs = logits_or_probs

        preds = (probs > threshold).float()
        targets = (targets > threshold).float()

        intersection = (preds * targets).sum().item()
        union = preds.sum().item() + targets.sum().item() - intersection

        if union == 0:
            return 1.0 if intersection == 0 else 0.0
        return float(intersection / (union + eps))


def compute_dice_score(
    logits_or_probs: torch.Tensor,
    targets: torch.Tensor,
    threshold: float = 0.5,
    eps: float = 1e-7,
) -> float:
    """Compute Dice Similarity Coefficient (F1-Score) for binary predictions."""
    with torch.no_grad():
        if logits_or_probs.min() < 0.0 or logits_or_probs.max() > 1.0:
            probs = torch.sigmoid(logits_or_probs)
        else:
            probs = logits_or_probs

        preds = (probs > threshold).float()
        targets = (targets > threshold).float()

        intersection = (preds * targets).sum().item()
        total = preds.sum().item() + targets.sum().item()

        if total == 0:
            return 1.0 if intersection == 0 else 0.0
        return float((2.0 * intersection) / (total + eps))


def train(
    data_dir: str,
    epochs: int = 50,
    batch_size: int = 8,
    learning_rate: float = 1e-4,
    output_dir: str = "weights",
    in_channels: int = 6,
    device: Optional[str] = None,
) -> Dict[str, Union[float, List[float]]]:
    """Execute training loop skeleton for U-Net burned area segmentation.

    Args:
        data_dir: Directory containing training dataset.
        epochs: Number of training epochs.
        batch_size: Batch size for DataLoader.
        learning_rate: Adam optimizer learning rate.
        output_dir: Directory to store model checkpoints.
        in_channels: Spectral band count (default 6 for Landsat).
        device: 'cuda' or 'cpu'. Defaults to automatic detection.

    Returns:
        Dictionary containing training history and best metrics.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    logger.info("Starting U-Net training on device: %s", device)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # Initialize model, criterion, and optimizer
    model = UNet(in_channels=in_channels, out_channels=1).to(device)
    criterion = BCEDiceLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=5)

    # Placeholder dataset / dataloader
    dataset_path = Path(data_dir)
    if dataset_path.exists() and any(dataset_path.iterdir()):
        dataset = BurnedAreaDataset(data_dir=data_dir)
        train_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    else:
        logger.warning("Data directory %s is empty or missing. Using mock dataset for training stub.", data_dir)
        # Mock dataset for demonstration / validation
        mock_imgs = [torch.randn(in_channels, 128, 128) for _ in range(16)]
        mock_masks = [(torch.rand(1, 128, 128) > 0.8).float() for _ in range(16)]
        dataset = list(zip(mock_imgs, mock_masks))
        train_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    best_iou = 0.0
    history = {"train_loss": [], "val_iou": [], "val_dice": []}

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0

        for batch_idx, (images, masks) in enumerate(train_loader):
            images = images.to(device)
            masks = masks.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / max(len(train_loader), 1)
        history["train_loss"].append(avg_loss)

        # Validation step (evaluating on training batch as skeleton stub)
        model.eval()
        with torch.no_grad():
            sample_img, sample_mask = next(iter(train_loader))
            sample_img = sample_img.to(device)
            sample_mask = sample_mask.to(device)
            val_logits = model(sample_img)
            val_iou = compute_iou(val_logits, sample_mask)
            val_dice = compute_dice_score(val_logits, sample_mask)

        history["val_iou"].append(val_iou)
        history["val_dice"].append(val_dice)
        scheduler.step(val_iou)

        logger.info(
            "Epoch [%d/%d] - Loss: %.4f - Val IoU: %.4f - Val Dice: %.4f",
            epoch,
            epochs,
            avg_loss,
            val_iou,
            val_dice,
        )

        # Save latest checkpoint
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "loss": avg_loss,
            "val_iou": val_iou,
            "val_dice": val_dice,
        }
        torch.save(checkpoint, out_path / "latest_checkpoint.pth")

        # Save best checkpoint based on IoU
        if val_iou > best_iou:
            best_iou = val_iou
            torch.save(checkpoint, out_path / "best_model.pth")
            logger.info("Saved new best model checkpoint with IoU: %.4f", best_iou)

    logger.info("Training complete. Best IoU: %.4f", best_iou)
    return {"best_iou": best_iou, "history": history}


def parse_args() -> argparse.Namespace:
    """Parse command line arguments for U-Net training."""
    parser = argparse.ArgumentParser(description="Train U-Net on satellite imagery for burned area segmentation.")
    parser.add_argument("--data_dir", type=str, default="data/samples", help="Path to training data directory.")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs.")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size per training step.")
    parser.add_argument("--learning_rate", type=float, default=1e-4, help="Learning rate for Adam optimizer.")
    parser.add_argument("--output_dir", type=str, default="weights", help="Directory where checkpoints will be stored.")
    parser.add_argument("--in_channels", type=int, default=6, help="Input spectral channels count (default: 6).")
    parser.add_argument("--device", type=str, default=None, help="Target device: 'cuda', 'cpu', or None for auto.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        output_dir=args.output_dir,
        in_channels=args.in_channels,
        device=args.device,
    )
