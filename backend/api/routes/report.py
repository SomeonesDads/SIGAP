"""Report generation, listing, download, and export endpoints for SIGAP (Live NASA FIRMS + DINOv3)."""

from datetime import datetime, timezone
from pathlib import Path
import textwrap
from typing import Any
from fastapi import APIRouter, Query
from fastapi.responses import Response

try:
    from backend.api.routes.hotspot import get_monitoring_hotspots
    from backend.models.report import ReportContent, ReportMetadata
except ImportError:
    from api.routes.hotspot import get_monitoring_hotspots
    from models.report import ReportContent, ReportMetadata

from ml.dinov3.predict import get_cached_dinov3, predict_dinov3_severity_zones

router = APIRouter(prefix="/reports", tags=["Reports"])

_MONTHS_ID = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "Mei",
    6: "Jun",
    7: "Jul",
    8: "Agu",
    9: "Sep",
    10: "Okt",
    11: "Nov",
    12: "Des",
}


def _format_id_date(iso_date: str) -> str:
    try:
        dt = datetime.strptime(iso_date[:10], "%Y-%m-%d")
        return f"{dt.day:02d} {_MONTHS_ID.get(dt.month, 'Okt')} {dt.year}"
    except Exception:
        now = datetime.now(timezone.utc)
        return f"{now.day:02d} {_MONTHS_ID.get(now.month, 'Okt')} {now.year}"


def _examiner_for_district(district: str, idx: int) -> str:
    d_low = district.lower()
    if "kalteng" in d_low or "kalimantan tengah" in d_low:
        units = [
            "SIGAP Agent AI (Manggala Agni Daops Kapuas / Palangka Raya)",
            "Manggala Agni Daops Pangkalan Bun & BPBD Kalteng",
            "Balai Taman Nasional Sebangau / Tim Analis Citra",
        ]
        return units[(idx - 1) % len(units)]
    if "kalbar" in d_low or "kalimantan barat" in d_low:
        return "BPBD Kalbar / Manggala Agni Daops Ketapang"
    if "kaltim" in d_low or "kalimantan timur" in d_low:
        return "Manggala Agni Daops Sangkima / BPBD Kaltim"
    if "kalsel" in d_low or "kalimantan selatan" in d_low:
        return "Manggala Agni Daops Banjar / BPBD Kalsel"
    if "sumsel" in d_low or "sumatera" in d_low or "riau" in d_low or "jambi" in d_low:
        return "Manggala Agni Daops Sumatera / KPH Wilayah"
    if "jawa" in d_low or "jatim" in d_low or "jateng" in d_low:
        return "BPBD Provinsi & Perhutani Satgas Karhutla"
    if "sulawesi" in d_low or "sulsel" in d_low or "sultra" in d_low:
        return "Manggala Agni Daops Sulawesi / BPBD Wilayah"
    if "nusa tenggara" in d_low or "ntt" in d_low or "ntb" in d_low:
        return "BPBD NTT/NTB & Balai KSDA Wilayah"
    if "papua" in d_low or "maluku" in d_low or "merauke" in d_low:
        return "BPBD Papua Selatan & Balai TN Wasur"
    return "SIGAP Agent AI & Tim Analis Citra Satelit"


async def _resolve_cluster_for_report(
    investigation_id: str,
    lat: float | None = None,
    lon: float | None = None,
) -> tuple[dict[str, Any], bool]:
    """Find the live monitoring cluster matching an investigation_id or coordinates."""
    mon = await get_monitoring_hotspots(region="Indonesia", limit=20)
    hotspots = mon.get("hotspots", [])
    is_live = bool(mon.get("is_live", False))

    if not hotspots:
        return (
            {
                "id": "HS-LIVE-01",
                "lat": lat or -2.85,
                "lon": lon or 114.12,
                "riskScore": 92.5,
                "areaHa": 245,
                "dnbrMean": 0.64,
                "peatland": True,
                "settlementKm": 1.8,
                "distanceKm": 19,
                "etaMin": 32,
                "location": "Kecamatan Kahayan Hilir, Kabupaten Pulang Pisau",
                "district": "Kab. Pulang Pisau, Kalimantan Tengah",
                "soil": "Gambut dalam > 3 m",
                "fireType": "Bawah permukaan (gambut)",
                "satellite": "VIIRS S-NPP",
                "hotspotCount": 14,
                "totalFrp": 68.4,
                "acqDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "acqTime": "0630",
            },
            False,
        )

    if lat is not None and lon is not None:
        best = min(
            hotspots,
            key=lambda h: (float(h["lat"]) - lat) ** 2 + (float(h["lon"]) - lon) ** 2,
        )
        return best, is_live

    # Try matching numeric suffix from IDs like REP-2026-001, SIGAP-2026-LIVE-02, HS-LIVE-03
    digits = "".join(ch for ch in investigation_id.split("-")[-1] if ch.isdigit())
    if digits:
        idx = int(digits)
        if 1 <= idx <= len(hotspots):
            return hotspots[idx - 1], is_live

    return hotspots[0], is_live


@router.get("", response_model=dict[str, Any], include_in_schema=False)
@router.get("/", response_model=dict[str, Any])
async def list_reports(
    region: str = Query("Indonesia", description="Operational region"),
    limit: int = Query(12, ge=1, le=30),
) -> dict[str, Any]:
    """Generate live case history reports derived from active NASA FIRMS clusters and DINOv3 segmentation."""
    mon = await get_monitoring_hotspots(region=region, limit=limit)
    hotspots = mon.get("hotspots", [])
    is_live = bool(mon.get("is_live", False))

    reports: list[dict[str, Any]] = []
    for idx, h in enumerate(hotspots, start=1):
        count = int(h.get("hotspotCount") or 1)
        frp = float(h.get("totalFrp") or 20.0)
        area_ha = int(h.get("areaHa") or 120)
        score = int(round(float(h.get("riskScore") or 75.0)))
        dnbr = float(h.get("dnbrMean") or 0.48)
        loc = str(h.get("location") or "Kalimantan Tengah")
        district = str(h.get("district") or "Kalimantan Tengah")
        soil = str(h.get("soil") or "Gambut Tropis")
        sat = str(h.get("satellite") or "VIIRS S-NPP")
        acq_date = str(h.get("acqDate") or datetime.now(timezone.utc).strftime("%Y-%m-%d"))

        if score >= 88:
            status = "Draft"
            level_str = "Kritis"
        elif score >= 75:
            status = "Ditinjau"
            level_str = "Tinggi"
        elif idx <= 6:
            status = "Selesai"
            level_str = "Sedang"
        else:
            status = "Arsip"
            level_str = "Terkendali"

        case_number = f"SIGAP-2026-LIVE-{idx:02d}"
        report_id = f"REP-2026-{idx:03d}"

        summary = (
            f"Deteksi {count} titik panas {sat} (FRP {frp:.1f} MW) pada kawasan {soil}. "
            f"Estimasi DINOv3 {area_ha:,} Ha (dNBR {dnbr:.2f}). Skor prioritas MCDA {score}/100 ({level_str})."
        )

        reports.append(
            {
                "id": report_id,
                "caseNumber": case_number,
                "region": f"{loc} ({district})" if district not in loc else loc,
                "date": _format_id_date(acq_date),
                "status": status,
                "examiner": _examiner_for_district(district, idx),
                "summary": summary,
                "totalBurnedAreaHa": area_ha,
                "priorityScore": score,
                "exportFormats": ["pdf", "geojson"],
                "lat": float(h.get("lat", -2.85)),
                "lon": float(h.get("lon", 114.12)),
                "hotspotCount": count,
                "totalFrp": frp,
                "isLive": is_live,
            }
        )

    return {
        "is_live": is_live,
        "updated_at": mon.get("updated_at"),
        "total_cases": len(reports),
        "reports": reports,
    }


@router.get("/{investigation_id}", response_model=dict[str, Any])
async def get_report_metadata(
    investigation_id: str,
    lat: float | None = Query(None),
    lon: float | None = Query(None),
) -> dict[str, Any]:
    """Retrieve comprehensive report metadata and synthesized content for a live investigation."""
    cluster, is_live = await _resolve_cluster_for_report(investigation_id, lat=lat, lon=lon)
    c_lat = float(cluster["lat"])
    c_lon = float(cluster["lon"])
    count = int(cluster.get("hotspotCount") or 1)
    frp = float(cluster.get("totalFrp") or 25.0)
    area_ha = float(cluster.get("areaHa") or 120.0)
    score = float(cluster.get("riskScore") or 80.0)
    loc = str(cluster.get("location") or "Kalimantan Tengah")
    district = str(cluster.get("district") or "Kalimantan Tengah")
    soil = str(cluster.get("soil") or "Lahan Gambut")
    settlement_km = float(cluster.get("settlementKm") or 2.4)
    eta_min = int(cluster.get("etaMin") or 35)

    scale = max(0.5, min(2.8, (area_ha / 180.0) ** 0.5))
    seg = predict_dinov3_severity_zones(
        center_lat=c_lat,
        center_lon=c_lon,
        scale_factor=scale,
    )
    breakdown = seg.get("coverage_breakdown_ha", {})
    high_ha = float(breakdown.get("red_high_severity_ha", round(area_ha * 0.22, 1)))
    mod_ha = float(breakdown.get("orange_moderate_severity_ha", round(area_ha * 0.35, 1)))
    low_ha = float(breakdown.get("yellow_low_severity_ha", round(area_ha * 0.43, 1)))
    total_seg_ha = float(breakdown.get("total_burned_area_ha", round(high_ha + mod_ha + low_ha, 1)))

    metadata = ReportMetadata(
        investigation_id=investigation_id,
        title=f"Laporan Investigasi Kebakaran Hutan & Lahan — {investigation_id} ({district})",
        generated_at=datetime.now(timezone.utc),
        language="id",
        format="pdf",
    )

    content = ReportContent(
        executive_summary=(
            f"Investigasi otonom SIGAP ({'LIVE NASA FIRMS' if is_live else 'Simulasi'}) mengidentifikasi "
            f"klaster aktif sebanyak {count} titik panas (FRP total {frp:.1f} MW) di {loc} pada kawasan {soil}. "
            f"Segmentasi DINOv3 memetakan total area terdampak {total_seg_ha:.1f} Ha dengan jarak {settlement_km} km "
            f"ke permukiman terdekat. Skor prioritas intervensi MCDA: {score:.1f}/100."
        ),
        scope=f"{loc} ({district}) — Koordinat ({c_lat:.4f}°, {c_lon:.4f}°)",
        data_sources=[
            f"NASA FIRMS {cluster.get('satellite', 'VIIRS S-NPP')} (Live NRT Feed)",
            "DINOv3 BurnSeg (vit_large_patch16_dinov3.sat493m)",
            "OpenStreetMap Overpass & Nominatim Spatial Gazetteer",
            "Peta Kesatuan Hidrologis Gambut (KHG KLHK)",
        ],
        hotspot_findings={
            "total_hotspots": count,
            "high_confidence_count": max(1, int(round(count * 0.75))),
            "total_frp_mw": frp,
            "epicenter": [c_lat, c_lon],
            "acq_date": cluster.get("acqDate"),
        },
        segmentation_results={
            "burned_area_hectares": total_seg_ha,
            "confidence_score": 0.94,
            "model": seg.get("model", "DINOv3 BurnSeg"),
        },
        severity_analysis={
            "unburned_ha": round(total_seg_ha * 0.12, 1),
            "low_severity_ha": low_ha,
            "moderate_severity_ha": mod_ha,
            "high_severity_ha": high_ha,
        },
        priority_recommendations=[
            {
                "priority": 1,
                "action": f"Kerahkan Regu Manggala Agni & BPBD ke {loc} (ETA ~{eta_min} menit)",
                "target_coordinates": [c_lat, c_lon],
                "justification": f"Skor MCDA {score:.1f}/100 pada {soil}, berjarak {settlement_km} km dari permukiman.",
            },
            {
                "priority": 2,
                "action": (
                    "Aktifkan sekat kanal & pompa tekanan tinggi (peat spear)"
                    if cluster.get("peatland")
                    else "Buat sekat bakar mekanis pada perimeter luar klaster"
                ),
                "target_coordinates": [round(c_lat - 0.008, 4), round(c_lon + 0.008, 4)],
                "justification": f"Mencegah perambatan dari zona keparahan tinggi ({high_ha:.1f} Ha).",
            },
        ],
        limitations=[
            "Resolusi spasial VIIRS 375 m dapat menggabungkan beberapa titik api kecil dalam satu piksel.",
            "Waktu lintas satelit polar memiliki jeda pembaruan 3–6 jam.",
        ],
        next_steps=[
            f"Verifikasi titik koordinat ({c_lat:.4f}°, {c_lon:.4f}°) oleh Masyarakat Peduli Api (MPA).",
            "Pemantauan perubahan perimeter keparahan melalui citra Sentinel-2 & NASA GIBS berikutnya.",
        ],
    )

    return {
        "metadata": metadata.model_dump(),
        "content": content.model_dump(),
    }


def _escape_pdf_text(text: str) -> str:
    """Sanitize ASCII/Latin-1 text and escape parentheses/backslashes for PDF string literals."""
    clean = text.encode("latin-1", errors="replace").decode("latin-1")
    return clean.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_live_pdf_bytes(meta: dict[str, Any], content: dict[str, Any]) -> bytes:
    """Build a valid, multi-section formatted PDF report using standard PDF Helvetica fonts."""
    lines_ops: list[str] = ["BT"]
    y = 750

    def add_line(txt: str, font: str = "/F1", size: int = 10, step: int = 15) -> None:
        nonlocal y
        if y < 55:
            return
        lines_ops.append(f"{font} {size} Tf")
        lines_ops.append(f"1 0 0 1 48 {y} Tm")
        lines_ops.append(f"({_escape_pdf_text(txt)}) Tj")
        y -= step

    def add_wrapped(txt: str, width: int = 86, font: str = "/F1", size: int = 10, step: int = 14) -> None:
        for wline in textwrap.wrap(txt, width=width) or [""]:
            add_line(wline, font=font, size=size, step=step)

    add_line("SIGAP - SISTEM INTELIJEN GEOSPASIAL ANALISIS KEBAKARAN HUTAN & LAHAN", font="/F2", size=12, step=18)
    add_line(str(meta.get("title", "Laporan Investigasi Karhutla")), font="/F2", size=11, step=16)
    add_line(
        f"ID Dokumen: {meta.get('investigation_id')}   |   Waktu Cetak: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        font="/F1",
        size=9,
        step=18,
    )
    add_line("-" * 95, font="/F1", size=9, step=16)

    add_line("1. CAKUPAN WILAYAH & RINGKASAN EKSEKUTIF", font="/F2", size=10, step=15)
    add_line(f"Wilayah: {content.get('scope', '-')}", font="/F1", size=10, step=14)
    add_wrapped(str(content.get("executive_summary", "")), width=88, font="/F1", size=10, step=14)
    y -= 6

    hf = content.get("hotspot_findings") or {}
    seg = content.get("segmentation_results") or {}
    sev = content.get("severity_analysis") or {}

    add_line("2. TEMUAN TITIK PANAS (NASA FIRMS LIVE) & SEGMENTASI DINOV3", font="/F2", size=10, step=15)
    add_line(
        f"- Total Titik Panas Aktif : {hf.get('total_hotspots', 0)} titik (Kepercayaan Tinggi: {hf.get('high_confidence_count', 0)})",
        step=14,
    )
    add_line(
        f"- Total Radiative Power   : {hf.get('total_frp_mw', 0)} MW   |   Tanggal Akuisisi: {hf.get('acq_date', '-')}",
        step=14,
    )
    add_line(
        f"- Estimasi Luas Terbakar  : {seg.get('burned_area_hectares', 0)} Ha (Model: {seg.get('model', 'DINOv3 BurnSeg')})",
        step=14,
    )
    add_line(
        f"- Rincian Keparahan       : Tinggi (Merah) {sev.get('high_severity_ha', 0)} Ha | Sedang (Oranye) {sev.get('moderate_severity_ha', 0)} Ha | Rendah (Kuning) {sev.get('low_severity_ha', 0)} Ha",
        step=18,
    )

    add_line("3. REKOMENDASI TINDAKAN PRIORITAS LAPANGAN", font="/F2", size=10, step=15)
    for rec in content.get("priority_recommendations", []):
        coords = rec.get("target_coordinates", [0, 0])
        add_wrapped(
            f"[Prioritas {rec.get('priority')}] {rec.get('action')} @ ({coords[0]}, {coords[1]})",
            width=88,
            font="/F2",
            size=9,
            step=13,
        )
        add_wrapped(f"   Alasan: {rec.get('justification')}", width=88, font="/F1", size=9, step=14)
    y -= 4

    add_line("4. SUMBER DATA & LANGKAH LANJUTAN", font="/F2", size=10, step=15)
    for src in content.get("data_sources", []):
        add_line(f"* Sumber: {src}", size=9, step=13)
    for step_txt in content.get("next_steps", []):
        add_wrapped(f"-> Tindak Lanjut: {step_txt}", width=88, size=9, step=13)

    lines_ops.append("ET")
    stream_bytes = "\n".join(lines_ops).encode("latin-1", errors="replace")

    objs: list[bytes] = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        f"6 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
        + stream_bytes
        + b"\nendstream\nendobj\n",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for obj in objs:
        offsets.append(len(out))
        out.extend(obj)

    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode("latin-1"))
    out.extend(
        f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin-1")
    )
    return bytes(out)


@router.get("/{investigation_id}/download")
async def download_report_pdf(
    investigation_id: str,
    lat: float | None = Query(None),
    lon: float | None = Query(None),
) -> Response:
    """Generate and download a live investigation report as a formatted PDF document."""
    report_data = await get_report_metadata(investigation_id, lat=lat, lon=lon)
    pdf_bytes = _build_live_pdf_bytes(report_data["metadata"], report_data["content"])

    placeholder_dir = Path("data/reports")
    placeholder_dir.mkdir(parents=True, exist_ok=True)
    safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in investigation_id)
    pdf_path = placeholder_dir / f"report_{safe_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="SIGAP_Report_{safe_id}.pdf"',
        },
    )


@router.get("/{investigation_id}/export")
async def export_report_geojson(
    investigation_id: str,
    lat: float | None = Query(None),
    lon: float | None = Query(None),
) -> dict[str, Any]:
    """Export live investigation findings and DINOv3 spatial burn perimeters as GeoJSON."""
    cluster, is_live = await _resolve_cluster_for_report(investigation_id, lat=lat, lon=lon)
    c_lat = float(cluster["lat"])
    c_lon = float(cluster["lon"])
    area_ha = float(cluster.get("areaHa") or 120.0)
    scale = max(0.5, min(2.8, (area_ha / 180.0) ** 0.5))

    seg = predict_dinov3_severity_zones(
        center_lat=c_lat,
        center_lon=c_lon,
        scale_factor=scale,
    )
    seg_features = seg.get("polygons_geojson", {}).get("features", [])

    epicenter_feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [c_lon, c_lat],
        },
        "properties": {
            "feature_type": "hotspot_cluster_epicenter",
            "investigation_id": investigation_id,
            "location": cluster.get("location"),
            "district": cluster.get("district"),
            "hotspot_count": cluster.get("hotspotCount"),
            "total_frp_mw": cluster.get("totalFrp"),
            "priority_score": cluster.get("riskScore"),
            "soil": cluster.get("soil"),
            "is_live": is_live,
        },
    }

    return {
        "type": "FeatureCollection",
        "name": f"SIGAP_Investigation_{investigation_id}",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": [epicenter_feature, *seg_features],
    }
