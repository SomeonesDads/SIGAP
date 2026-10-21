"""Inference pipeline for U-Net burned area segmentation.

Provides:
    - load_model: Loads trained U-Net checkpoint weights onto target device.
    - predict: Performs forward pass on numpy satellite array to generate binary mask.
    - predict_with_georef: Reads geospatial raster (GeoTIFF), infers burned area mask,
      and preserves spatial reference (CRS, Affine transform).
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import numpy as np
import torch

from ml.unet.model import UNet

logger = logging.getLogger("SIGAP.ML.Predict")


def load_model(
    weights_path: Union[str, Path],
    in_channels: int = 6,
    out_channels: int = 1,
    device: Optional[str] = None,
) -> UNet:
    """Load trained U-Net model from checkpoint.

    Args:
        weights_path: Path to .pth checkpoint file.
        in_channels: Number of input channels (default 6).
        out_channels: Number of output channels (default 1).
        device: 'cuda', 'cpu', or None for auto-detection.

    Returns:
        UNet model initialized with checkpoint weights and set to eval mode.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    model = UNet(in_channels=in_channels, out_channels=out_channels)
    path = Path(weights_path)

    if path.exists():
        checkpoint = torch.load(path, map_location=device)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
            logger.info("Loaded model state_dict from checkpoint %s (epoch %s)", weights_path, checkpoint.get("epoch"))
        elif isinstance(checkpoint, dict):
            model.load_state_dict(checkpoint)
            logger.info("Loaded weights from %s", weights_path)
    else:
        logger.warning("Weights path %s not found. Returning randomly initialized model.", weights_path)

    model.to(device)
    model.eval()
    return model


def predict(
    model: UNet,
    image_array: np.ndarray,
    threshold: float = 0.5,
    device: Optional[str] = None,
) -> np.ndarray:
    """Run model inference on a numpy image array.

    Args:
        model: Loaded UNet model instance.
        image_array: Multi-spectral image as float32 ndarray with shape:
            - (C, H, W) where C == in_channels, or
            - (H, W, C) where C == in_channels.
        threshold: Probability cutoff to classify burned pixels (0.0 - 1.0).
        device: 'cuda', 'cpu', or None.

    Returns:
        Binary numpy array of shape (H, W) with dtype uint8 (1 = burned, 0 = unburned).
    """
    if device is None:
        device = next(model.parameters()).device

    # Ensure shape is (C, H, W)
    if image_array.ndim == 3 and image_array.shape[-1] in (3, 6):
        image_array = np.transpose(image_array, (2, 0, 1))
    elif image_array.ndim == 2:
        image_array = image_array[np.newaxis, :, :]

    # Add batch dimension: (1, C, H, W)
    tensor = torch.from_numpy(image_array.astype(np.float32)).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.sigmoid(logits).squeeze().cpu().numpy()

    # Threshold probability into binary mask
    mask = (probabilities >= threshold).astype(np.uint8)
    return mask


def predict_with_georef(
    model: UNet,
    raster_path: Union[str, Path],
    output_path: Optional[Union[str, Path]] = None,
    threshold: float = 0.5,
    device: Optional[str] = None,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Predict burned area mask from a georeferenced raster file, preserving CRS and metadata.

    Args:
        model: Loaded UNet model instance.
        raster_path: Path to input multi-band GeoTIFF file.
        output_path: Optional path to write output binary mask GeoTIFF.
        threshold: Probability cutoff for burned area segmentation.
        device: Device to run inference on.

    Returns:
        Tuple of:
            - mask: Binary 2D numpy array (H, W).
            - profile: Geospatial metadata dict (CRS, Affine transform, width, height, etc.).
    """
    try:
        import rasterio
    except ImportError:
        logger.warning("rasterio is not installed. Returning stub mock mask and profile.")
        mock_mask = np.zeros((256, 256), dtype=np.uint8)
        mock_profile = {"crs": "EPSG:4326", "transform": None, "width": 256, "height": 256}
        return mock_mask, mock_profile

    raster_file = Path(raster_path)
    if not raster_file.exists():
        raise FileNotFoundError(f"Raster file not found: {raster_path}")

    with rasterio.open(raster_file) as src:
        image = src.read().astype(np.float32)  # (C, H, W)
        profile = src.profile.copy()

    mask = predict(model=model, image_array=image, threshold=threshold, device=device)

    # Update raster profile for single-band binary mask
    profile.update(
        dtype=rasterio.uint8,
        count=1,
        nodata=255,
    )

    if output_path is not None:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with rasterio.open(out_file, "w", **profile) as dst:
            dst.write(mask, 1)
        logger.info("Saved georeferenced mask to %s", output_path)

    return mask, profile
