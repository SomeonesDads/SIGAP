/**
 * Data model & sample data for the SIGAP monitoring map.
 *
 * Sample hotspots mirror the fields shown on the Figma hotspot card
 * (Frame 21). Replace `SAMPLE_HOTSPOTS` with data from `/api/hotspots`
 * once the backend exposes severity and location metadata.
 */

export type Severity = "tinggi" | "sedang" | "rendah";

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; surface: string; icon: string }
> = {
  tinggi: {
    label: "Tinggi",
    color: "#d51411",
    surface: "rgba(213,20,17,0.25)",
    icon: "/figma/fire-high.svg",
  },
  sedang: {
    label: "Sedang",
    color: "#d97706",
    surface: "rgba(217,119,6,0.25)",
    icon: "/figma/fire-medium.svg",
  },
  rendah: {
    label: "Rendah",
    color: "#ebbc56",
    surface: "rgba(235,188,86,0.3)",
    icon: "/figma/fire-low.svg",
  },
};

export interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  severity: Severity;
  /** Composite MCDA risk score (0-100). */
  riskScore: number;
  /** Road distance from the nearest available crew (km). */
  distanceKm: number;
  /** Estimated crew travel time (minutes). */
  etaMin: number;
  areaHa: number;
  dnbrMean: number;
  imagery: string;
  peatland: boolean;
  settlementKm: number;
  status: string;
  location: string;
  district?: string;
  fireType: string;
  soil: string;
  lastCondition: string;
  satellite: string;
  hotspotCount?: number;
  totalFrp?: number;
  acqDate?: string;
  acqTime?: string;
  isLive?: boolean;
}

export const SAMPLE_HOTSPOTS: Hotspot[] = [
  {
    id: "HS-0412",
    lat: -3.041,
    lon: 112.1004,
    severity: "tinggi",
    riskScore: 96.4,
    distanceKm: 18,
    etaMin: 28,
    areaHa: 412,
    dnbrMean: 0.74,
    imagery: "FIRMS NRT 2026-10-21 06:15 UTC",
    peatland: true,
    settlementKm: 1.2,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Seruyan Hilir, Kabupaten Seruyan",
    district: "Kab. Seruyan, Kalimantan Tengah",
    fireType: "Bawah permukaan (gambut)",
    soil: "Gambut Pesisir > 2 m",
    lastCondition: "Klaster aktif (281 titik panas, FRP 1996.1 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 281,
    totalFrp: 1996.1,
  },
  {
    id: "HS-0415",
    lat: -1.3661,
    lon: 104.104,
    severity: "tinggi",
    riskScore: 94.8,
    distanceKm: 24,
    etaMin: 39,
    areaHa: 385,
    dnbrMean: 0.69,
    imagery: "FIRMS NRT 2026-10-21 06:30 UTC",
    peatland: true,
    settlementKm: 1.6,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Kumpeh, Kabupaten Muaro Jambi",
    district: "Kab. Muaro Jambi, Jambi",
    fireType: "Bawah permukaan (gambut)",
    soil: "Gambut Dalam Berbak",
    lastCondition: "Klaster aktif (346 titik panas, FRP 1640.5 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 346,
    totalFrp: 1640.5,
  },
  {
    id: "HS-0418",
    lat: -7.8458,
    lon: 140.6195,
    severity: "tinggi",
    riskScore: 93.2,
    distanceKm: 29,
    etaMin: 46,
    areaHa: 310,
    dnbrMean: 0.66,
    imagery: "FIRMS NRT 2026-10-21 05:10 UTC",
    peatland: true,
    settlementKm: 2.1,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Distrik Tanah Miring, Kabupaten Merauke",
    district: "Kab. Merauke, Papua Selatan",
    fireType: "Permukaan & rawa",
    soil: "Rawa Gambut & Savana Wasur",
    lastCondition: "Klaster aktif (121 titik panas, FRP 980.4 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 121,
    totalFrp: 980.4,
  },
  {
    id: "HS-0398",
    lat: -3.3908,
    lon: 105.2324,
    severity: "tinggi",
    riskScore: 91.5,
    distanceKm: 21,
    etaMin: 35,
    areaHa: 295,
    dnbrMean: 0.64,
    imagery: "FIRMS NRT 2026-10-21 06:30 UTC",
    peatland: true,
    settlementKm: 1.4,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Tulung Selapan, Kabupaten Ogan Komering Ilir",
    district: "Kab. OKI, Sumatera Selatan",
    fireType: "Bawah permukaan (gambut)",
    soil: "Kubah Gambut Dalam > 3 m",
    lastCondition: "Klaster aktif (302 titik panas, FRP 1420.0 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 302,
    totalFrp: 1420.0,
  },
  {
    id: "HS-0421",
    lat: -2.829,
    lon: 110.6947,
    severity: "tinggi",
    riskScore: 88.6,
    distanceKm: 34,
    etaMin: 52,
    areaHa: 240,
    dnbrMean: 0.59,
    imagery: "FIRMS NRT 2026-10-21 06:15 UTC",
    peatland: true,
    settlementKm: 2.4,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Kendawangan, Kabupaten Ketapang",
    district: "Kab. Ketapang, Kalimantan Barat",
    fireType: "Permukaan & gambut",
    soil: "Gambut Pesisir 1-2 m",
    lastCondition: "Klaster aktif (192 titik panas, FRP 1336.1 MW)",
    satellite: "VIIRS NOAA-20",
    hotspotCount: 192,
    totalFrp: 1336.1,
  },
  {
    id: "HS-0405",
    lat: -1.3416,
    lon: 116.2079,
    severity: "tinggi",
    riskScore: 83.4,
    distanceKm: 27,
    etaMin: 44,
    areaHa: 145,
    dnbrMean: 0.52,
    imagery: "FIRMS NRT 2026-10-21 05:45 UTC",
    peatland: false,
    settlementKm: 2.3,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Long Ikis, Kabupaten Paser",
    district: "Kab. Paser, Kalimantan Timur",
    fireType: "Permukaan",
    soil: "Mineral & Aluvial",
    lastCondition: "Klaster aktif (37 titik panas, FRP 441.8 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 37,
    totalFrp: 441.8,
  },
  {
    id: "HS-0417",
    lat: -1.6638,
    lon: 120.9702,
    severity: "sedang",
    riskScore: 69.3,
    distanceKm: 42,
    etaMin: 64,
    areaHa: 118,
    dnbrMean: 0.45,
    imagery: "FIRMS NRT 2026-10-21 05:30 UTC",
    peatland: false,
    settlementKm: 3.8,
    status: "Perlu cek lapangan",
    location: "Kecamatan Petasia, Kabupaten Morowali Utara",
    district: "Kab. Morowali Utara, Sulawesi Tengah",
    fireType: "Permukaan",
    soil: "Mineral Ultrabasa",
    lastCondition: "Klaster aktif (70 titik panas, FRP 312.4 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 70,
    totalFrp: 312.4,
  },
  {
    id: "HS-0430",
    lat: -9.449,
    lon: 124.3048,
    severity: "sedang",
    riskScore: 68.1,
    distanceKm: 36,
    etaMin: 58,
    areaHa: 134,
    dnbrMean: 0.43,
    imagery: "FIRMS NRT 2026-10-21 05:30 UTC",
    peatland: false,
    settlementKm: 4.1,
    status: "Perlu cek lapangan",
    location: "Kecamatan Amanuban Tengah, Kab. Timor Tengah Selatan",
    district: "Kab. TTS, Nusa Tenggara Timur",
    fireType: "Permukaan (Savana)",
    soil: "Karst & Savana Kering",
    lastCondition: "Klaster aktif (116 titik panas, FRP 485.2 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 116,
    totalFrp: 485.2,
  },
  {
    id: "HS-0388",
    lat: -7.7574,
    lon: 112.5924,
    severity: "sedang",
    riskScore: 64.5,
    distanceKm: 22,
    etaMin: 38,
    areaHa: 68,
    dnbrMean: 0.39,
    imagery: "FIRMS NRT 2026-10-21 06:00 UTC",
    peatland: false,
    settlementKm: 2.9,
    status: "Perlu cek lapangan",
    location: "Kawasan Lereng Arjuno-Welirang, Kabupaten Pasuruan",
    district: "Kab. Pasuruan, Jawa Timur",
    fireType: "Permukaan (Savana)",
    soil: "Vulkanik & Savana",
    lastCondition: "Klaster aktif (22 titik panas, FRP 148.6 MW)",
    satellite: "VIIRS NOAA-20",
    hotspotCount: 22,
    totalFrp: 148.6,
  },
  {
    id: "HS-0379",
    lat: 1.28,
    lon: 101.25,
    severity: "tinggi",
    riskScore: 81.2,
    distanceKm: 26,
    etaMin: 41,
    areaHa: 156,
    dnbrMean: 0.54,
    imagery: "FIRMS NRT 2026-10-21 06:45 UTC",
    peatland: true,
    settlementKm: 2.2,
    status: "Terkonfirmasi citra (Live FIRMS)",
    location: "Kecamatan Mandau, Kabupaten Bengkalis",
    district: "Kab. Bengkalis, Riau",
    fireType: "Bawah permukaan (gambut)",
    soil: "Kubah Gambut Pesisir > 3 m",
    lastCondition: "Klaster aktif (44 titik panas, FRP 320.4 MW)",
    satellite: "VIIRS S-NPP",
    hotspotCount: 44,
    totalFrp: 320.4,
  },
];

export interface Dinov3ZoneRing {
  tier: "OUTER_YELLOW" | "MID_AMBER" | "INNER_ORANGE" | "CORE_DEEPRED";
  label: string;
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  weight: number;
  dashArray?: string;
  radiusKm: number;
  positions: [number, number][];
}

/**
 * Generate 4 concentric organic DINOv3 BurnSeg coverage polygon rings around a hotspot/cluster,
 * transitioning from Deep Red at the fire core out to Yellowish at the outer spread perimeter.
 * Uses zoom-adaptive visual scaling so the covered area overlay is clearly visible at Indonesia-wide
 * zoom (zoom 4–6) and tightens to true physical kilometer radii when zoomed in (zoom 9–13).
 */
export function buildDinov3CoverageRings(
  hotspot: Pick<Hotspot, "lat" | "lon" | "areaHa" | "hotspotCount" | "totalFrp" | "dnbrMean" | "riskScore">,
  zoom = 5
): Dinov3ZoneRing[] {
  const count = Math.max(1, hotspot.hotspotCount ?? 8);
  const areaHa = Math.max(15, hotspot.areaHa ?? 120);
  const frp = Math.max(10, hotspot.totalFrp ?? 80);

  // Physical outer fire radius in km derived from cluster area & intensity (typically 1.8 km – 6.5 km)
  const physicalOuterKm = Math.min(
    7.5,
    Math.max(1.8, Math.sqrt(areaHa / Math.PI) * 0.45 + Math.log10(count + 1) * 1.15 + Math.min(1.5, frp / 800))
  );

  // At archipelago zoom (zoom 4–6), 2 km is <1 px, so apply a smooth zoom-adaptive visual multiplier
  // that converges to 1.0x (exact physical radius) at zoom >= 10.
  const zoomScale =
    zoom <= 4
      ? 14.5
      : zoom === 5
      ? 10.5
      : zoom === 6
      ? 6.8
      : zoom === 7
      ? 4.0
      : zoom === 8
      ? 2.4
      : zoom === 9
      ? 1.45
      : 1.0;

  const effectiveOuterKm = physicalOuterKm * zoomScale;
  const latDegPerKm = 1.0 / 110.574;
  const lonDegPerKm = 1.0 / (111.32 * Math.max(0.25, Math.cos((hotspot.lat * Math.PI) / 180)));

  // Deterministic wind/plume orientation per cluster coordinate
  const phase = ((Math.abs(hotspot.lat * 37.0) + Math.abs(hotspot.lon * 19.0)) % (2 * Math.PI));
  const nPts = 16;

  const makeRing = (fraction: number): [number, number][] => {
    const pts: [number, number][] = [];
    const baseR = effectiveOuterKm * fraction;
    for (let i = 0; i < nPts; i++) {
      const angle = (2 * Math.PI * i) / nPts;
      const anisotropy =
        1.0 +
        0.18 * Math.cos(angle - phase) +
        0.09 * Math.sin(2 * angle + phase) +
        0.05 * Math.cos(3 * angle);
      const rKm = baseR * anisotropy;
      const dLat = rKm * Math.sin(angle) * latDegPerKm;
      const dLon = rKm * Math.cos(angle) * lonDegPerKm;
      pts.push([Number((hotspot.lat + dLat).toFixed(5)), Number((hotspot.lon + dLon).toFixed(5))]);
    }
    return pts;
  };

  // Ordered outermost (Yellowish) -> innermost (Deep Red) so Leaflet layers them properly
  return [
    {
      tier: "OUTER_YELLOW",
      label: "Zona Kuning — Sebaran Luar & Risiko Perambatan (DINOv3)",
      fillColor: "#fde047",
      strokeColor: "#eab308",
      fillOpacity: 0.28,
      weight: 1.2,
      dashArray: "4 4",
      radiusKm: Number(physicalOuterKm.toFixed(2)),
      positions: makeRing(1.0),
    },
    {
      tier: "MID_AMBER",
      label: "Zona Oranye-Kuning — Transisi Termal & Asap (DINOv3)",
      fillColor: "#fb923c",
      strokeColor: "#f97316",
      fillOpacity: 0.40,
      weight: 1.2,
      radiusKm: Number((physicalOuterKm * 0.72).toFixed(2)),
      positions: makeRing(0.72),
    },
    {
      tier: "INNER_ORANGE",
      label: "Zona Merah-Oranye — Area Terbakar Aktif (DINOv3)",
      fillColor: "#ef4444",
      strokeColor: "#dc2626",
      fillOpacity: 0.54,
      weight: 1.5,
      radiusKm: Number((physicalOuterKm * 0.46).toFixed(2)),
      positions: makeRing(0.46),
    },
    {
      tier: "CORE_DEEPRED",
      label: "Zona Merah Tua — Episentrum Inti Kebakaran (DINOv3)",
      fillColor: "#991b1b",
      strokeColor: "#7f1d1d",
      fillOpacity: 0.76,
      weight: 1.8,
      radiusKm: Number((physicalOuterKm * 0.24).toFixed(2)),
      positions: makeRing(0.24),
    },
  ];
}

export function rankHotspots(hotspots: Hotspot[]): Hotspot[] {
  return [...hotspots].sort((a, b) => b.riskScore - a.riskScore);
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
  zoom: number;
}

/** Named places available in the "Cari lokasi..." search. */
export const PLACES: Place[] = [
  { name: "Indonesia", lat: -2.2, lon: 118.0, zoom: 5 },
  { name: "Kalimantan Tengah", lat: -1.68, lon: 113.38, zoom: 7 },
  { name: "Kalimantan Timur", lat: 0.54, lon: 116.42, zoom: 7 },
  { name: "Kalimantan Barat", lat: -0.28, lon: 111.48, zoom: 7 },
  { name: "Kalimantan Selatan", lat: -3.09, lon: 115.28, zoom: 8 },
  { name: "Riau", lat: 0.29, lon: 101.71, zoom: 7 },
  { name: "Sumatera Selatan", lat: -3.32, lon: 103.91, zoom: 7 },
  { name: "Jambi", lat: -1.61, lon: 103.61, zoom: 8 },
  { name: "Jawa Timur", lat: -7.75, lon: 112.75, zoom: 8 },
  { name: "Sulawesi Tengah", lat: -1.43, lon: 121.44, zoom: 7 },
  { name: "Nusa Tenggara Timur", lat: -9.65, lon: 124.05, zoom: 7 },
  { name: "Papua Selatan (Merauke)", lat: -7.85, lon: 140.45, zoom: 7 },
];

export type DroneMode = "Siaga" | "Menuju target" | "Memadamkan" | "Kembali ke base";

export interface Drone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  base: [number, number];
  baseName?: string;
  targetId: string | null;
  mode: DroneMode;
  /** Battery percentage (0-100). */
  battery: number;
  /** Extinguisher payload remaining (litres). */
  extinguisherL: number;
  extinguisherCapacityL: number;
}

const DAOPS_BASES: Array<{ name: string; coords: [number, number] }> = [
  { name: "Lanud Tjilik Riwut (Palangka Raya)", coords: [-2.225, 113.942] },
  { name: "Lanud Iskandar (Pangkalan Bun)", coords: [-2.705, 111.673] },
  { name: "Posko Daops Sampit (Kotim)", coords: [-2.501, 112.975] },
  { name: "Posko Daops Ketapang (Kalbar)", coords: [-1.816, 109.963] },
  { name: "Lanud Syamsudin Noor (Banjarbaru)", coords: [-3.442, 114.763] },
  { name: "Lanud Sepinggan (Balikpapan)", coords: [-1.268, 116.894] },
  { name: "Posko Daops Muara Teweh (Barut)", coords: [-0.957, 114.895] },
  { name: "Lanud Roesmin Nurjadin (Pekanbaru)", coords: [0.461, 101.444] },
  { name: "Lanud SM Badaruddin II (Palembang)", coords: [-2.898, 104.701] },
  { name: "Posko Daops Muaro Jambi (Jambi)", coords: [-1.634, 103.645] },
  { name: "Lanud Abdulrachman Saleh (Malang)", coords: [-7.926, 112.714] },
  { name: "Lanud Sultan Hasanuddin (Makassar)", coords: [-5.061, 119.554] },
  { name: "Lanud El Tari (Kupang NTT)", coords: [-10.171, 123.671] },
  { name: "Lanud J.A. Dimara (Merauke Papua)", coords: [-8.52, 140.418] },
];

function findNearestBase(
  lat: number,
  lon: number,
  excludeCoords?: [number, number]
): { name: string; coords: [number, number] } {
  const candidates = excludeCoords
    ? DAOPS_BASES.filter(
        (b) =>
          Math.hypot(b.coords[0] - excludeCoords[0], b.coords[1] - excludeCoords[1]) > 0.05
      )
    : DAOPS_BASES;
  const pool = candidates.length > 0 ? candidates : DAOPS_BASES;
  return pool.reduce((best, b) => {
    const dBest = Math.hypot(best.coords[0] - lat, best.coords[1] - lon);
    const dCur = Math.hypot(b.coords[0] - lat, b.coords[1] - lon);
    return dCur < dBest ? b : best;
  }, pool[0]);
}

export function createDrones(priorityHotspots?: Hotspot[]): Drone[] {
  const h1 = priorityHotspots?.[0];
  const h2 = priorityHotspots?.[1] ?? priorityHotspots?.[0];

  const base1 = h1
    ? findNearestBase(h1.lat, h1.lon)
    : DAOPS_BASES[0];
  const base2 = h2
    ? findNearestBase(h2.lat, h2.lon, base1.coords)
    : DAOPS_BASES[1];

  return [
    {
      id: "DRN-01",
      name: "Drone A",
      lat: base1.coords[0],
      lon: base1.coords[1],
      base: base1.coords,
      baseName: base1.name,
      targetId: h1?.id ?? null,
      mode: h1 ? "Menuju target" : "Siaga",
      battery: 100,
      extinguisherL: 40,
      extinguisherCapacityL: 40,
    },
    {
      id: "DRN-02",
      name: "Drone B",
      lat: base2.coords[0],
      lon: base2.coords[1],
      base: base2.coords,
      baseName: base2.name,
      targetId: h2?.id ?? null,
      mode: h2 ? "Menuju target" : "Siaga",
      battery: 100,
      extinguisherL: 40,
      extinguisherCapacityL: 40,
    },
  ];
}

const STEP_DEG = 0.055;

function moveToward(d: Drone, lat: number, lon: number, stepDeg = STEP_DEG): { lat: number; lon: number; arrived: boolean } {
  const dLat = lat - d.lat;
  const dLon = lon - d.lon;
  const dist = Math.hypot(dLat, dLon);
  if (dist <= stepDeg) return { lat, lon, arrived: true };
  return { lat: d.lat + (dLat / dist) * stepDeg, lon: d.lon + (dLon / dist) * stepDeg, arrived: false };
}

/**
 * Advance the drone simulation by one tick: each drone flies from its nearest
 * Daops airbase to its assigned live priority hotspot, discharges payload
 * proportional to cluster FRP & peatland intensity, then returns to base.
 */
export function stepDrone(d: Drone, hotspots: Hotspot[]): Drone {
  const target = hotspots.find((h) => h.id === d.targetId);

  if (d.mode === "Kembali ke base") {
    const next = moveToward(d, d.base[0], d.base[1], STEP_DEG * 1.15);
    if (next.arrived) {
      return { ...d, ...next, mode: "Siaga", battery: 100, extinguisherL: d.extinguisherCapacityL };
    }
    return { ...d, ...next, battery: Math.round(Math.max(0, d.battery - 0.35) * 10) / 10 };
  }

  if (!target) return d;

  if (d.battery < 20 || d.extinguisherL <= 0) {
    return { ...d, mode: "Kembali ke base" };
  }

  // Scale discharge and hover power draw dynamically from live cluster FRP and peatland status
  const frpFactor = Math.min(2.0, Math.max(0.8, (target.totalFrp ?? 30) / 45));
  const peatMultiplier = target.peatland ? 1.25 : 1.0;

  if (d.mode === "Memadamkan") {
    const dropRate = Math.round(1.8 * frpFactor * peatMultiplier * 10) / 10;
    const hoverDrain = Math.round(0.55 * peatMultiplier * 10) / 10;
    return {
      ...d,
      battery: Math.round(Math.max(0, d.battery - hoverDrain) * 10) / 10,
      extinguisherL: Math.round(Math.max(0, d.extinguisherL - dropRate) * 10) / 10,
    };
  }

  const urgencyStep = STEP_DEG * (target.riskScore >= 85 ? 1.2 : 1.0);
  const next = moveToward(d, target.lat, target.lon, urgencyStep);
  return {
    ...d,
    lat: next.lat,
    lon: next.lon,
    mode: next.arrived ? "Memadamkan" : "Menuju target",
    battery: Math.round(Math.max(0, d.battery - 0.4) * 10) / 10,
  };
}

