"""Report generation, download, and export endpoints for SIGAP."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from fastapi import APIRouter
from fastapi.responses import FileResponse

try:
    from backend.models.report import ReportContent, ReportMetadata
except ImportError:
    from models.report import ReportContent, ReportMetadata

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{investigation_id}", response_model=dict[str, Any])
async def get_report_metadata(investigation_id: str) -> dict[str, Any]:
    """Retrieve comprehensive report metadata and synthesized content for an investigation."""
    metadata = ReportMetadata(
        investigation_id=investigation_id,
        title=f"Laporan Investigasi Kebakaran Hutan & Lahan — {investigation_id}",
        generated_at=datetime.now(timezone.utc),
        language="id",
        format="pdf",
    )

    content = ReportContent(
        executive_summary=(
            "Investigasi otonom SIGAP mengidentifikasi kebakaran aktif pada kubah gambut "
            "dengan potensi perambatan ke arah permukiman dalam radius 3.5 km. "
            "Rekomendasi respons cepat: sekat bakar dan pemadaman udara (water bombing)."
        ),
        scope="Kecamatan Kahayan Hilir, Kabupaten Pulang Pisau, Kalimantan Tengah",
        data_sources=[
            "NASA FIRMS VIIRS (SNPP & NOAA-20)",
            "Sentinel-2 MSI Level-2A (Surface Reflectance via GEE)",
            "Peta Kesatuan Hidrologis Gambut (KLHK)",
            "BMKG Stasiun Meteorologi Tjilik Riwut",
        ],
        hotspot_findings={
            "total_hotspots": 24,
            "high_confidence_count": 18,
            "max_frp_mw": 52.8,
            "cluster_count": 2,
        },
        segmentation_results={
            "burned_area_hectares": 128.5,
            "confidence_score": 0.94,
        },
        severity_analysis={
            "unburned_ha": 12.0,
            "low_severity_ha": 34.5,
            "moderate_severity_ha": 52.0,
            "high_severity_ha": 30.0,
        },
        priority_recommendations=[
            {
                "priority": 1,
                "action": "Kirim Regu Manggala Agni Posko Pulang Pisau ke Klaster Utara",
                "target_coordinates": [-2.4512, 114.1205],
                "justification": "Dekat perimeter gambut dalam dan berjarak 3 km dari Desa Sebangau Mulya",
            },
            {
                "priority": 2,
                "action": "Mobilisasi pompa pemadam air dari kanal terdekat",
                "target_coordinates": [-2.4589, 114.1298],
                "justification": "Ketersediaan air kanal sekunder terpantau cukup",
            },
        ],
        limitations=[
            "Tutupan awan tipis (cirrus) sebesar 6% pada bagian tenggara area kajian.",
            "Waktu tunda satelit polar sekitar 3-6 jam dari saat akuisisi.",
        ],
        next_steps=[
            "Konfirmasi laporan lapangan oleh relawan Masyarakat Peduli Api (MPA).",
            "Pemantauan lanjutan lintasan satelit NOAA-20 pukul 13:30 WIB.",
        ],
    )

    return {
        "metadata": metadata.model_dump(),
        "content": content.model_dump(),
    }


@router.get("/{investigation_id}/download")
async def download_report_pdf(investigation_id: str) -> FileResponse:
    """Download investigation report as PDF document (stub placeholder)."""
    # Ensure placeholder directory and dummy PDF stub exist
    placeholder_dir = Path("data/reports")
    placeholder_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = placeholder_dir / f"report_{investigation_id}.pdf"

    if not pdf_path.exists():
        minimal_pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
            b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
            b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
            b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
        )
        pdf_path.write_bytes(minimal_pdf)

    return FileResponse(
        path=str(pdf_path),
        filename=f"SIGAP_Report_{investigation_id}.pdf",
        media_type="application/pdf",
    )


@router.get("/{investigation_id}/export")
async def export_report_geojson(investigation_id: str) -> dict[str, Any]:
    """Export investigation findings and spatial perimeters as GeoJSON."""
    return {
        "type": "FeatureCollection",
        "name": f"SIGAP_Investigation_{investigation_id}",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [114.1205, -2.4512],
                },
                "properties": {
                    "feature_type": "hotspot_epicenter",
                    "investigation_id": investigation_id,
                    "confidence": "high",
                    "frp_mw": 45.2,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [114.115, -2.448],
                            [114.135, -2.448],
                            [114.135, -2.468],
                            [114.115, -2.468],
                            [114.115, -2.448],
                        ]
                    ],
                },
                "properties": {
                    "feature_type": "burned_area_perimeter",
                    "investigation_id": investigation_id,
                    "area_ha": 128.5,
                    "severity": "High Severity",
                },
            },
        ],
    }
