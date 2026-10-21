"""Tests for the U-Net architecture and ML pipeline components."""

import torch
from ml.unet.model import UNet
from ml.unet.train import DiceLoss, compute_dice_score, compute_iou


def test_unet_forward_pass() -> None:
    """Validate U-Net forward pass tensor dimensions and output shapes."""
    batch_size = 2
    in_channels = 6
    height, width = 64, 64

    # Use smaller feature maps for rapid unit testing
    model = UNet(in_channels=in_channels, out_channels=1, features=[16, 32, 64, 128])
    dummy_input = torch.randn(batch_size, in_channels, height, width)

    output = model(dummy_input)

    assert output.shape == torch.Size([batch_size, 1, height, width]), (
        f"Expected output shape ({batch_size}, 1, {height}, {width}), but got {output.shape}"
    )
    assert not torch.isnan(output).any(), "Model output contains NaN values"
    assert not torch.isinf(output).any(), "Model output contains Inf values"


def test_unet_odd_dimensions() -> None:
    """Validate that U-Net handles odd spatial dimensions via skip-connection padding."""
    model = UNet(in_channels=6, out_channels=1, features=[16, 32, 64, 128])
    dummy_input = torch.randn(1, 6, 65, 65)

    output = model(dummy_input)
    assert output.shape == torch.Size([1, 1, 65, 65])


def test_metrics_and_loss() -> None:
    """Test DiceLoss, IoU, and Dice score computation."""
    logits = torch.tensor([[10.0, -10.0], [-10.0, 10.0]])  # High confidence predictions
    targets = torch.tensor([[1.0, 0.0], [0.0, 1.0]])

    dice_loss = DiceLoss()(logits, targets)
    assert dice_loss.item() < 0.1  # Should be close to 0 for matching predictions

    iou = compute_iou(logits, targets)
    assert iou > 0.9

    dice = compute_dice_score(logits, targets)
    assert dice > 0.9
