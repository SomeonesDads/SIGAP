"""U-Net architecture for multi-band satellite burned area segmentation.

This module implements a standard 2D U-Net (Ronneberger et al., 2015) customized
for satellite remote sensing data (e.g., Landsat 8/9, Sentinel-2). The network
uses an encoder-decoder architecture with skip connections that preserve high-resolution
spatial details required to accurately delineate irregular wildfire burn scars.

Default input configuration expects 6 spectral bands:
    - Band 2 (Blue): ~0.48 µm
    - Band 3 (Green): ~0.56 µm
    - Band 4 (Red): ~0.65 µm
    - Band 5 (Near Infrared / NIR): ~0.86 µm
    - Band 6 (Shortwave Infrared 1 / SWIR-1): ~1.61 µm
    - Band 7 (Shortwave Infrared 2 / SWIR-2): ~2.20 µm

Output produces a single-channel logits map representing the probability of burned area.
"""

from typing import List, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F


class DoubleConv(nn.Module):
    """Double 2D Convolution block: [Conv2d -> BatchNorm2d -> ReLU] * 2.

    Applies two successive 3x3 convolutions with same-padding, batch normalization,
    and ReLU activations.

    Attributes:
        block: Sequential container of convolutional and normalization layers.
    """

    def __init__(self, in_channels: int, out_channels: int, mid_channels: Optional[int] = None) -> None:
        """Initialize the double convolution block.

        Args:
            in_channels: Number of input feature channels.
            out_channels: Number of output feature channels.
            mid_channels: Optional intermediate channel count. Defaults to out_channels.
        """
        super().__init__()
        if not mid_channels:
            mid_channels = out_channels
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through the double convolution block.

        Args:
            x: Input tensor of shape (batch_size, in_channels, height, width).

        Returns:
            Output tensor of shape (batch_size, out_channels, height, width).
        """
        return self.block(x)


class Down(nn.Module):
    """Downscaling block: MaxPool2d (2x2) followed by a DoubleConv block.

    Halves the spatial resolution while doubling feature channels.
    """

    def __init__(self, in_channels: int, out_channels: int) -> None:
        """Initialize the downscaling block.

        Args:
            in_channels: Input channels from the preceding encoder stage.
            out_channels: Output channels after convolution.
        """
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(kernel_size=2, stride=2),
            DoubleConv(in_channels, out_channels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through downscaling.

        Args:
            x: Input tensor.

        Returns:
            Downsampled and convolved tensor.
        """
        return self.maxpool_conv(x)


class Up(nn.Module):
    """Upscaling block: Upsampling followed by concatenation of skip connections and DoubleConv.

    Supports either learned Transposed Convolution or Bilinear interpolation.
    Handles padding adjustments if feature maps have odd spatial dimensions.
    """

    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = False) -> None:
        """Initialize the upscaling block.

        Args:
            in_channels: Total input channels from the decoder bottleneck or lower stage.
            out_channels: Output feature channels.
            bilinear: If True, uses bilinear interpolation; otherwise uses ConvTranspose2d.
        """
        super().__init__()
        self.bilinear = bilinear

        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        """Forward pass combining upsampled features and skip connections.

        Args:
            x1: Feature map from previous decoder layer to be upsampled.
            x2: High-resolution skip connection feature map from corresponding encoder layer.

        Returns:
            Combined and convolved feature map.
        """
        x1 = self.up(x1)

        # Handle potential padding difference if input dimensions were odd
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]

        if diff_y != 0 or diff_x != 0:
            x1 = F.pad(
                x1,
                [
                    diff_x // 2,
                    diff_x - diff_x // 2,
                    diff_y // 2,
                    diff_y - diff_y // 2,
                ],
            )

        # Concatenate along channel dimension
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    """Final 1x1 convolution mapping latent channels to target class masks."""

    def __init__(self, in_channels: int, out_channels: int) -> None:
        """Initialize final convolution.

        Args:
            in_channels: Number of incoming channels.
            out_channels: Number of target output classes (e.g., 1 for binary burned area).
        """
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Apply 1x1 convolution."""
        return self.conv(x)


class UNet(nn.Module):
    """U-Net architecture for multi-spectral burned area segmentation.

    The model follows an encoder-decoder topology with skip connections:
        - Encoder: 4 downsampling stages capturing semantic and spatial context.
        - Bottleneck: Deepest feature representation.
        - Decoder: 4 upsampling stages reconstructing pixel-level boundary masks.
        - Skip Connections: Preserves fine geographic boundaries and small burn patches.

    Args:
        in_channels: Number of input spectral bands. Default is 6 (Landsat B2, B3, B4, B5, B6, B7).
        out_channels: Number of output prediction channels. Default is 1 (binary burned/unburned).
        features: Channel sizes for encoder stages. Default is [64, 128, 256, 512].
        bilinear: Whether to use bilinear upsampling instead of transposed convolutions. Default is False.

    Example:
        >>> model = UNet(in_channels=6, out_channels=1)
        >>> dummy_input = torch.randn(2, 6, 256, 256)
        >>> logits = model(dummy_input)
        >>> print(logits.shape)
        torch.Size([2, 1, 256, 256])
    """

    def __init__(
        self,
        in_channels: int = 6,
        out_channels: int = 1,
        features: Optional[List[int]] = None,
        bilinear: bool = False,
    ) -> None:
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.bilinear = bilinear

        if features is None:
            features = [64, 128, 256, 512]

        # Encoder path
        self.inc = DoubleConv(in_channels, features[0])
        self.down1 = Down(features[0], features[1])
        self.down2 = Down(features[1], features[2])
        self.down3 = Down(features[2], features[3])

        factor = 2 if bilinear else 1
        self.down4 = Down(features[3], features[3] * 2 // factor)

        # Decoder path
        self.up1 = Up(features[3] * 2, features[3] // factor, bilinear)
        self.up2 = Up(features[3], features[2] // factor, bilinear)
        self.up3 = Up(features[2], features[1] // factor, bilinear)
        self.up4 = Up(features[1], features[0], bilinear)

        # Classification head
        self.outc = OutConv(features[0], out_channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through the U-Net.

        Args:
            x: Input tensor of shape (batch_size, in_channels, height, width).

        Returns:
            Logits tensor of shape (batch_size, out_channels, height, width).
            Apply torch.sigmoid() during inference to get probabilities.
        """
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        logits = self.outc(x)
        return logits
