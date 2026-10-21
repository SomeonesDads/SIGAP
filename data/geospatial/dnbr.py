"""Differenced Normalized Burn Ratio (dNBR) Analysis for Wildfire Severity.

The Normalized Burn Ratio (NBR) is calculated using Near-Infrared (NIR) and
Shortwave-Infrared (SWIR-2) wavelengths. Healthy vegetation exhibits high NIR
reflectance and low SWIR reflectance, whereas burned areas with char and bare soil
reflect heavily in SWIR and absorb in NIR.

Formulas:
    NBR = (NIR - SWIR) / (NIR + SWIR)
    dNBR = (NBR_prefire - NBR_postfire) * 1000

References:
    - Key, C. H., & Benson, N. C. (2006). Landscape Assessment: Ground measure of
      severity, the Composite Burn Index; and Remote sensing of severity, the
      Normalized Burn Ratio. USDA Forest Service General Technical Report.
    - USGS FIREMON Burn Severity Guide: https://www.un-spider.org/advisory-support/recommended-practices/recommended-practice-burn-severity
"""

import logging
from typing import Dict, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger("SIGAP.Data.dNBR")

# Standard USGS FIREMON burn severity classification thresholds (scaled by 1000)
DEFAULT_SEVERITY_THRESHOLDS: Dict[str, Tuple[float, float]] = {
    "enhanced_regrowth": (-500.0, -100.0),
    "unburned": (-100.0, 100.0),
    "low_severity": (100.0, 270.0),
    "moderate_low_severity": (270.0, 440.0),
    "moderate_high_severity": (440.0, 660.0),
    "high_severity": (660.0, 2000.0),
}

# Integer class mapping
SEVERITY_CLASS_CODES: Dict[str, int] = {
    "enhanced_regrowth": -1,
    "unburned": 0,
    "low_severity": 1,
    "moderate_low_severity": 2,
    "moderate_high_severity": 3,
    "high_severity": 4,
}


def compute_nbr(
    nir_band: np.ndarray,
    swir_band: np.ndarray,
    eps: float = 1e-6,
) -> np.ndarray:
    """Compute the Normalized Burn Ratio (NBR) index from NIR and SWIR bands.

    Args:
        nir_band: Near-Infrared band array (e.g. Landsat 8/9 Band 5 or Sentinel-2 Band 8).
        swir_band: Shortwave-Infrared band array (e.g. Landsat 8/9 Band 7 or Sentinel-2 Band 12).
        eps: Small epsilon constant to prevent division by zero in zero-reflectance pixels.

    Returns:
        Numpy array of NBR values with range [-1.0, 1.0].
    """
    nir = nir_band.astype(np.float32)
    swir = swir_band.astype(np.float32)

    numerator = nir - swir
    denominator = nir + swir + eps

    nbr = numerator / denominator
    return np.clip(nbr, -1.0, 1.0)


def compute_dnbr(
    nbr_before: np.ndarray,
    nbr_after: np.ndarray,
    scale_factor: float = 1000.0,
) -> np.ndarray:
    """Compute differenced Normalized Burn Ratio (dNBR) between pre-fire and post-fire rasters.

    Higher positive values indicate severe burn damage, whereas negative values indicate
    vegetation regrowth or moisture increases.

    Args:
        nbr_before: Pre-fire NBR array.
        nbr_after: Post-fire NBR array.
        scale_factor: Multiplier to match USGS standard integer scale (default 1000.0).

    Returns:
        Numpy array of dNBR values.
    """
    if nbr_before.shape != nbr_after.shape:
        raise ValueError(
            f"Shape mismatch: nbr_before {nbr_before.shape} != nbr_after {nbr_after.shape}"
        )

    dnbr = (nbr_before.astype(np.float32) - nbr_after.astype(np.float32)) * scale_factor
    return dnbr


def classify_severity(
    dnbr: np.ndarray,
    thresholds: Optional[Dict[str, Tuple[float, float]]] = None,
    return_numeric: bool = True,
) -> np.ndarray:
    """Classify dNBR values into discrete burn severity categories.

    Thresholds follow the USGS FIREMON standard by default:
        - Enhanced Regrowth: dNBR < -100
        - Unburned: -100 <= dNBR < +100
        - Low Severity: +100 <= dNBR < +270
        - Moderate-Low Severity: +270 <= dNBR < +440
        - Moderate-High Severity: +440 <= dNBR < +660
        - High Severity: dNBR >= +660

    IMPORTANT CAVEATS ON THRESHOLD UNIVERSALITY:
        1. Peatland Ecosystems (Lahan Gambut): In tropical peat swamp forests
           (e.g., Central Kalimantan, Riau, South Sumatra), fires frequently smolder
           sub-surface. Canopy loss may be delayed or sparse, producing lower optical dNBR
           values than the actual ecological destruction warrants.
        2. Soil Moisture & Standing Water: Post-fire rains or peat flooding dramatically
           alter SWIR absorption, which can cause spurious anomalies in dNBR values.
        3. Seasonality: Natural dry season leaf shedding (senescence) or agricultural
           clearing can mimic moderate burn severity without actual wildfire occurrences.
           Thresholds must be cross-verified against thermal hotspot clusters and local conditions.

    Args:
        dnbr: 2D numpy array of dNBR values.
        thresholds: Custom dictionary mapping class names to (min, max) range tuples.
        return_numeric: If True, returns integer class codes (-1 to 4).
                        If False, returns object array with class name strings.

    Returns:
        Classified numpy array of same shape as dNBR.
    """
    if thresholds is None:
        thresholds = DEFAULT_SEVERITY_THRESHOLDS

    if return_numeric:
        classified = np.zeros(dnbr.shape, dtype=np.int8)
        for class_name, (low, high) in thresholds.items():
            mask = (dnbr >= low) & (dnbr < high)
            code = SEVERITY_CLASS_CODES.get(class_name, 0)
            classified[mask] = code
        return classified
    else:
        classified_str = np.full(dnbr.shape, fill_value="unburned", dtype=object)
        for class_name, (low, high) in thresholds.items():
            mask = (dnbr >= low) & (dnbr < high)
            classified_str[mask] = class_name
        return classified_str
