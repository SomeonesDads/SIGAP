"""Risk-based Wildfire Prioritization and Multi-Criteria Decision Analysis.

Calculates multi-factor urgency scores for detected hotspot clusters and burn scars,
incorporating peatland vulnerability, settlement proximity, hotspot recurrence,
U-Net/dNBR estimated damage, and satellite evidence confidence.

Produces actionable, human-interpretable explanations ('Why This Area?')
to assist field dispatchers (BPBD, Manggala Agni).
"""

from dataclasses import asdict, dataclass
import logging
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger("SIGAP.Data.Priority")

# Default multi-criteria weighting scheme (sums to 1.0)
DEFAULT_WEIGHTS: Dict[str, float] = {
    "peatland": 0.25,             # Tropical peatland protection (high CO2 & smoldering risk)
    "settlement_proximity": 0.25, # Threat to human settlements / haze hazard
    "hotspot_count": 0.15,        # Fire front magnitude
    "hotspot_recurrence": 0.15,   # Persistent uncontained fire activity
    "burned_area": 0.10,          # Size of estimated burn scar (hectares)
    "dnbr_severity": 0.10,        # Spectral severity of vegetation destruction
}


@dataclass
class PriorityFactors:
    """Multi-criteria factors used to calculate wildfire intervention priority.

    Attributes:
        is_peatland: True if located on tropical peatland (lahan gambut).
        distance_to_settlement_km: Distance in km to the nearest community or village.
        hotspot_count: Number of satellite thermal hotspots within the cluster.
        hotspot_recurrence: Number of distinct days or satellite passes detecting fire here.
        estimated_burned_area_ha: Predicted burn scar area in hectares (from U-Net or dNBR).
        dnbr_severity: Qualitative severity string ('high_severity', 'moderate_high_severity',
            'moderate_low_severity', 'low_severity', 'unburned').
        evidence_quality: Confidence multiplier based on cloud absence and sensor reliability (0.0 to 1.0).
        wind_speed_kmh: Surface wind speed in km/h driving fire front propagation.
        wind_towards_settlement_alignment: Cosine alignment [-1.0, 1.0] between wind vector and
            the vector from the fire cluster toward the nearest settlement (+1.0 = directly downwind).
        flammability_index: Fuel dryness / flammability index (0.0 to 1.0).
        sensor_agreement_confidence: Multi-sensor cross-validation confidence (0.0 to 1.0).
    """

    is_peatland: bool = False
    distance_to_settlement_km: float = 15.0
    hotspot_count: int = 1
    hotspot_recurrence: int = 1
    estimated_burned_area_ha: float = 0.0
    dnbr_severity: str = "unburned"
    evidence_quality: float = 1.0
    wind_speed_kmh: float = 12.0
    wind_towards_settlement_alignment: float = 0.0
    flammability_index: float = 0.5
    sensor_agreement_confidence: float = 0.9

    def to_dict(self) -> Dict[str, Any]:
        """Convert factors to a dictionary."""
        return asdict(self)


def compute_priority_score(
    factors: Union[PriorityFactors, Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    """Compute a normalized risk priority score between 0.0 and 100.0.

    Args:
        factors: PriorityFactors instance or equivalent dictionary.
        weights: Optional dictionary overriding DEFAULT_WEIGHTS.

    Returns:
        Float priority score bounded within [0.0, 100.0].
    """
    if isinstance(factors, dict):
        f = PriorityFactors(**{k: v for k, v in factors.items() if k in PriorityFactors.__annotations__})
    else:
        f = factors

    w = weights if weights is not None else DEFAULT_WEIGHTS

    # 1. Peatland component (0 or 100, modulated slightly by fuel flammability)
    peat_subscore = 100.0 if f.is_peatland else max(0.0, (float(f.flammability_index) - 0.55) * 60.0)

    # 2. Settlement proximity component with Downwind Wind-Vector Threat adjustment
    # Effective distance shrinks when strong wind blows directly from fire toward settlement
    dist = max(0.0, float(f.distance_to_settlement_km))
    wind_kmh = max(0.0, float(f.wind_speed_kmh))
    alignment = max(-1.0, min(1.0, float(f.wind_towards_settlement_alignment)))
    wind_factor = 1.0 - (alignment * min(0.40, (wind_kmh / 35.0) * 0.40))
    effective_dist = dist * max(0.55, min(1.25, wind_factor))

    if effective_dist <= 1.0:
        settlement_subscore = 100.0
    elif effective_dist <= 3.0:
        settlement_subscore = 80.0 + (3.0 - effective_dist) * 10.0
    elif effective_dist <= 5.0:
        settlement_subscore = 55.0 + (5.0 - effective_dist) * 12.5
    elif effective_dist <= 10.0:
        settlement_subscore = 25.0 + (10.0 - effective_dist) * 6.0
    else:
        settlement_subscore = max(0.0, 10.0 - (effective_dist - 10.0))
    settlement_subscore = min(100.0, settlement_subscore)

    # 3. Hotspot count subscore (saturates at 20 hotspots)
    count_subscore = min(100.0, (f.hotspot_count / 20.0) * 100.0)

    # 4. Hotspot recurrence subscore (saturates at 5 days/passes)
    recurrence_subscore = min(100.0, (f.hotspot_recurrence / 5.0) * 100.0)

    # 5. Burned area subscore (saturates at 100 hectares)
    area_subscore = min(100.0, (max(0.0, f.estimated_burned_area_ha) / 100.0) * 100.0)

    # 6. dNBR severity subscore
    severity_mapping = {
        "high_severity": 100.0,
        "high": 100.0,
        "moderate_high_severity": 75.0,
        "moderate-high": 75.0,
        "moderate_low_severity": 50.0,
        "moderate-low": 50.0,
        "low_severity": 25.0,
        "low": 25.0,
        "unburned": 0.0,
        "enhanced_regrowth": 0.0,
    }
    dnbr_subscore = severity_mapping.get(str(f.dnbr_severity).lower(), 10.0)

    # Weighted sum
    raw_score = (
        w.get("peatland", 0.25) * peat_subscore
        + w.get("settlement_proximity", 0.25) * settlement_subscore
        + w.get("hotspot_count", 0.15) * count_subscore
        + w.get("hotspot_recurrence", 0.15) * recurrence_subscore
        + w.get("burned_area", 0.10) * area_subscore
        + w.get("dnbr_severity", 0.10) * dnbr_subscore
    )

    # Scale by combined evidence quality and multi-sensor cross-validation agreement
    quality = max(0.1, min(1.0, float(f.evidence_quality)))
    sensor_conf = max(0.2, min(1.0, float(f.sensor_agreement_confidence)))
    combined_confidence = 0.65 * quality + 0.35 * sensor_conf
    final_score = raw_score * (0.78 + 0.22 * combined_confidence)

    return round(float(min(100.0, max(0.0, final_score))), 1)


def rank_areas(
    areas_with_factors: List[Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None,
) -> List[Dict[str, Any]]:
    """Calculate scores and rank target areas descending by urgency.

    Args:
        areas_with_factors: List of area dicts containing 'factors' (dict or PriorityFactors).
        weights: Optional weights dict.

    Returns:
        List of area dicts with added 'priority_score', 'priority_level', and 'explanation',
        sorted in descending order of priority score.
    """
    ranked: List[Dict[str, Any]] = []

    for item in areas_with_factors:
        area = dict(item)
        factors = area.get("factors", {})
        score = compute_priority_score(factors, weights=weights)
        area["priority_score"] = score

        # Categorize level
        if score >= 75.0:
            level = "CRITICAL"
        elif score >= 50.0:
            level = "HIGH"
        elif score >= 25.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        area["priority_level"] = level
        area["explanation"] = explain_priority(area)
        ranked.append(area)

    ranked.sort(key=lambda x: x["priority_score"], reverse=True)
    return ranked


def explain_priority(area: Dict[str, Any]) -> str:
    """Generate a human-readable explanation ('Why This Area?') in English/Indonesian.

    Args:
        area: Area dict containing 'priority_score', 'priority_level', and 'factors'.

    Returns:
        Multi-sentence explanatory string outlining the top risk drivers.
    """
    raw_factors = area.get("factors", {})
    if isinstance(raw_factors, PriorityFactors):
        f = raw_factors
    elif isinstance(raw_factors, dict):
        f = PriorityFactors(**{k: v for k, v in raw_factors.items() if k in PriorityFactors.__annotations__})
    else:
        return "Priority calculated based on default geospatial parameters."

    score = area.get("priority_score", compute_priority_score(f))
    level = area.get("priority_level", "HIGH" if score >= 50 else "LOW")

    reasons: List[str] = []

    # Check key risk drivers
    if f.is_peatland:
        reasons.append("Berada di zona lahan gambut rentan dengan risiko kebakaran bawah permukaan (smoldering fire)")
    if f.distance_to_settlement_km <= 2.0:
        reasons.append(f"Sangat dekat dengan permukiman warga ({f.distance_to_settlement_km:.1f} km), berisiko tinggi terhadap keselamatan dan kabut asap")
    elif f.distance_to_settlement_km <= 5.0:
        reasons.append(f"Berada di sekitar radius permukiman ({f.distance_to_settlement_km:.1f} km)")

    if f.wind_towards_settlement_alignment >= 0.25 and f.wind_speed_kmh >= 14.0:
        reasons.append(
            f"Vektor angin kencang ({f.wind_speed_kmh:.0f} km/j) mendorong perambatan kepala api & asap mengarah ke permukiman (downwind threat)"
        )

    if f.hotspot_count >= 5:
        reasons.append(f"Konsentrasi titik panas tinggi ({f.hotspot_count} hotspot terdeteksi)")

    if f.hotspot_recurrence >= 2:
        reasons.append(f"Titik panas terdeteksi berulang ({f.hotspot_recurrence} hari/pass berturut-turut), mengindikasikan api belum terkendali")

    if f.estimated_burned_area_ha > 0:
        reasons.append(f"Estimasi area terbakar mencapai {f.estimated_burned_area_ha:.1f} hektar")

    if str(f.dnbr_severity).lower() in ("high", "high_severity", "moderate_high_severity"):
        reasons.append(f"Indeks dNBR mengonfirmasi tingkat kerusakan vegetasi tinggi ({f.dnbr_severity})")

    if f.sensor_agreement_confidence >= 0.85:
        reasons.append(f"Validasi lintas-sensor satelit tinggi (kepercayaan {int(f.sensor_agreement_confidence * 100)}%)")
    elif f.sensor_agreement_confidence < 0.55:
        reasons.append("Deteksi satelit tunggal berintensitas rendah (perlu verifikasi lapangan terhadap potensi false positive)")

    if f.evidence_quality < 0.7:
        reasons.append("Catatan: Kualitas observasi satelit terhambat awan, verifikasi darat/patroli direkomendasikan")

    if not reasons:
        reasons.append("Aktivitas titik panas terisolasi di luar area pemukiman kritis")

    summary_text = (
        f"Prioritas [{level}] (Skor: {score}/100). "
        f"Alasan Utama: " + "; ".join(reasons) + "."
    )
    return summary_text

