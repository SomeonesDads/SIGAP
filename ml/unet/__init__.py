"""U-Net segmentation submodule for burned area detection.

Provides U-Net architecture, training, inference, preprocessing,
and post-processing pipelines.
"""

from ml.unet.model import UNet

__all__ = ["UNet"]
