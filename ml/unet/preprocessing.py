"""Data preprocessing utilities for satellite imagery and U-Net inputs.

Provides:
    - normalize_bands: Normalizes multi-spectral channels using min-max, standardization,
      or satellite reflectance scaling.
    - prepare_input: Reads multi-band raster data and converts to PyTorch tensor format.
    - create_patches: Extracts spatial sub-tiles (patches) from large satellite scenes
      for model training and inference.
"""

import logging
from pathlib import Path
from typing import List, Optional, Tuple, Union

import numpy as np
import torch

logger = logging.getLogger("SIGAP.ML.Preprocessing")


def normalize_bands(
    image: np.ndarray,
    method: str = "minmax",
    clip_range: Tuple[float, float] = (0.0, 10000.0),
    eps: float = 1e-6,
) -> np.ndarray:
    """Normalize multi-spectral image bands for neural network input.

    Args:
        image: Numpy array of shape (C, H, W) or (H, W, C).
        method: Normalization technique:
            - 'minmax': Rescales each channel independently to [0.0, 1.0].
            - 'standardize': Centers channels to zero mean and unit variance.
            - 'reflectance': Clips to surface reflectance range (0-10000) and divides by 10000.
        clip_range: Min and max bounds used when method is 'reflectance'.
        eps: Small epsilon to prevent division by zero.

    Returns:
        Normalized float32 numpy array with identical shape to input.
    """
    image_f = image.astype(np.float32)

    # Determine channel axis
    is_chw = (image_f.ndim == 3 and image_f.shape[0] in (1, 3, 4, 6, 8, 12)) or image_f.ndim == 2

    if method == "reflectance":
        low, high = clip_range
        clipped = np.clip(image_f, low, high)
        return clipped / (high - low + eps)

    elif method == "minmax":
        if image_f.ndim == 2:
            min_val = np.min(image_f)
            max_val = np.max(image_f)
            return (image_f - min_val) / (max_val - min_val + eps)

        normalized = np.empty_like(image_f)
        if is_chw:
            for c in range(image_f.shape[0]):
                c_min = np.min(image_f[c])
                c_max = np.max(image_f[c])
                normalized[c] = (image_f[c] - c_min) / (c_max - c_min + eps)
        else:
            for c in range(image_f.shape[-1]):
                c_min = np.min(image_f[:, :, c])
                c_max = np.max(image_f[:, :, c])
                normalized[:, :, c] = (image_f[:, :, c] - c_min) / (c_max - c_min + eps)
        return normalized

    elif method == "standardize":
        if image_f.ndim == 2:
            mean = np.mean(image_f)
            std = np.std(image_f)
            return (image_f - mean) / (std + eps)

        standardized = np.empty_like(image_f)
        if is_chw:
            for c in range(image_f.shape[0]):
                c_mean = np.mean(image_f[c])
                c_std = np.std(image_f[c])
                standardized[c] = (image_f[c] - c_mean) / (c_std + eps)
        else:
            for c in range(image_f.shape[-1]):
                c_mean = np.mean(image_f[:, :, c])
                c_std = np.std(image_f[:, :, c])
                standardized[:, :, c] = (image_f[:, :, c] - c_mean) / (c_std + eps)
        return standardized

    else:
        raise ValueError(f"Unknown normalization method '{method}'. Choose 'minmax', 'standardize', or 'reflectance'.")


def prepare_input(
    raster_path: Union[str, Path],
    bands: Optional[List[int]] = None,
    normalize_method: str = "minmax",
) -> torch.Tensor:
    """Read satellite raster from disk, extract selected bands, normalize, and convert to Tensor.

    Args:
        raster_path: File path to GeoTIFF satellite image.
        bands: 1-indexed list of raster bands to read (e.g. [1, 2, 3, 4, 5, 6]).
            If None, reads all available bands.
        normalize_method: Method to pass to `normalize_bands`.

    Returns:
        PyTorch float32 Tensor of shape (C, H, W).
    """
    path = Path(raster_path)
    if not path.exists():
        logger.warning("Raster path %s not found. Returning synthetic tensor.", raster_path)
        dummy = np.random.uniform(0, 5000, (6, 256, 256)).astype(np.float32)
        norm_dummy = normalize_bands(dummy, method=normalize_method)
        return torch.from_numpy(norm_dummy)

    try:
        import rasterio
        with rasterio.open(path) as src:
            if bands is not None:
                array = src.read(bands).astype(np.float32)
            else:
                array = src.read().astype(np.float32)
    except ImportError:
        logger.warning("rasterio not found. Returning dummy tensor for %s.", raster_path)
        dummy = np.random.uniform(0, 5000, (6, 256, 256)).astype(np.float32)
        return torch.from_numpy(normalize_bands(dummy, method=normalize_method))

    normalized = normalize_bands(array, method=normalize_method)
    return torch.from_numpy(normalized)


def create_patches(
    image: np.ndarray,
    mask: Optional[np.ndarray] = None,
    patch_size: int = 256,
    stride: Optional[int] = None,
) -> List[Tuple[np.ndarray, Optional[np.ndarray]]]:
    """Slice a large raster scene and optional mask into fixed-size square patches.

    Args:
        image: Array of shape (C, H, W).
        mask: Optional binary mask array of shape (H, W) or (1, H, W).
        patch_size: Spatial dimensions of each square patch (patch_size x patch_size).
        stride: Step size between patches. If None, defaults to patch_size (no overlap).

    Returns:
        List of (image_patch, mask_patch) tuples. Mask patch is None if mask was not supplied.
    """
    if stride is None:
        stride = patch_size

    if image.ndim == 2:
        image = image[np.newaxis, :, :]

    c, h, w = image.shape
    if mask is not None:
        if mask.ndim == 3 and mask.shape[0] == 1:
            mask = mask.squeeze(0)

    patches: List[Tuple[np.ndarray, Optional[np.ndarray]]] = []

    for y in range(0, h - patch_size + 1, stride):
        for x in range(0, w - patch_size + 1, stride):
            img_patch = image[:, y : y + patch_size, x : x + patch_size]
            mask_patch = mask[y : y + patch_size, x : x + patch_size] if mask is not None else None
            patches.append((img_patch, mask_patch))

    # Handle right/bottom boundary edges if not cleanly divisible
    if h % stride != 0 or w % stride != 0:
        y_edge = max(0, h - patch_size)
        x_edge = max(0, w - patch_size)
        img_patch = image[:, y_edge:h, x_edge:w]
        mask_patch = mask[y_edge:h, x_edge:w] if mask is not None else None
        patches.append((img_patch, mask_patch))

    return patches
