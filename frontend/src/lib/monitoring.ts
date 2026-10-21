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
  /** Surface wind speed (km/h) driving fire front & smoke plume elongation. */
  windSpeedKmh?: number;
  /** Downwind spread direction in meteorological degrees (0 = N, 90 = E, 180 = S, 270 = W). */
  windDirectionDeg?: number;
  /** Compass label for downwind spread vector (e.g. "Barat Laut (310°)"). */
  windDirectionLabel?: string;
  /** Relative humidity percentage (lower = drier, faster surface ignition). */
  humidityPct?: number;
  /** Fuel & environment flammability index (0.0 - 1.0) derived from soil, vegetation, dNBR, and humidity. */
  flammabilityIndex?: number;
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
    windSpeedKmh: 24,
    windDirectionDeg: 315,
    windDirectionLabel: "Barat Laut (315°)",
    humidityPct: 44,
    flammabilityIndex: 0.94,
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
    windSpeedKmh: 19,
    windDirectionDeg: 330,
    windDirectionLabel: "Barat Laut (330°)",
    humidityPct: 46,
    flammabilityIndex: 0.92,
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
    windSpeedKmh: 31,
    windDirectionDeg: 295,
    windDirectionLabel: "Barat-Barat Laut (295°)",
    humidityPct: 39,
    flammabilityIndex: 0.89,
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
    windSpeedKmh: 17,
    windDirectionDeg: 305,
    windDirectionLabel: "Barat Laut (305°)",
    humidityPct: 48,
    flammabilityIndex: 0.91,
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
    windSpeedKmh: 26,
    windDirectionDeg: 340,
    windDirectionLabel: "Utara-Barat Laut (340°)",
    humidityPct: 47,
    flammabilityIndex: 0.85,
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
    windSpeedKmh: 14,
    windDirectionDeg: 25,
    windDirectionLabel: "Utara-Timur Laut (25°)",
    humidityPct: 58,
    flammabilityIndex: 0.58,
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
    windSpeedKmh: 12,
    windDirectionDeg: 65,
    windDirectionLabel: "Timur-Timur Laut (65°)",
    humidityPct: 62,
    flammabilityIndex: 0.51,
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
    windSpeedKmh: 34,
    windDirectionDeg: 285,
    windDirectionLabel: "Barat-Barat Laut (285°)",
    humidityPct: 33,
    flammabilityIndex: 0.88,
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
    windSpeedKmh: 21,
    windDirectionDeg: 250,
    windDirectionLabel: "Barat-Barat Daya (250°)",
    humidityPct: 45,
    flammabilityIndex: 0.67,
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
    windSpeedKmh: 16,
    windDirectionDeg: 40,
    windDirectionLabel: "Timur Laut (40°)",
    humidityPct: 51,
    flammabilityIndex: 0.81,
  },
];

const COMPASS_ID = [
  "Utara",
  "Utara-Timur Laut",
  "Timur Laut",
  "Timur-Timur Laut",
  "Timur",
  "Timur-Tenggara",
  "Tenggara",
  "Selatan-Tenggara",
  "Selatan",
  "Selatan-Barat Daya",
  "Barat Daya",
  "Barat-Barat Daya",
  "Barat",
  "Barat-Barat Laut",
  "Barat Laut",
  "Utara-Barat Laut",
] as const;

export function formatCompassAzimuth(deg: number): string {
  const norm = ((Math.round(deg) % 360) + 360) % 360;
  const idx = Math.round(norm / 22.5) % 16;
  return `${COMPASS_ID[idx]} (${norm}°)`;
}

export interface FireEnvironmentMetrics {
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  humidityPct: number;
  flammabilityIndex: number;
  flammabilityLabel: string;
  lengthToBreadthRatio: number;
  majorAxisKm: number;
  minorAxisKm: number;
}

/**
 * Derive physics-informed environmental fire spread parameters (wind speed, azimuth,
 * fuel flammability index, and elliptical Length-to-Breadth ratio) from hotspot telemetry
 * and soil/fuel characteristics.
 */
export function getHotspotEnvironment(
  hotspot: Pick<
    Hotspot,
    | "lat"
    | "lon"
    | "areaHa"
    | "hotspotCount"
    | "totalFrp"
    | "dnbrMean"
    | "riskScore"
    | "peatland"
    | "soil"
    | "fireType"
    | "windSpeedKmh"
    | "windDirectionDeg"
    | "windDirectionLabel"
    | "humidityPct"
    | "flammabilityIndex"
  >
): FireEnvironmentMetrics {
  const soilStr = `${hotspot.soil ?? ""} ${hotspot.fireType ?? ""}`.toLowerCase();
  const isSavanna = soilStr.includes("savana") || soilStr.includes("karst") || soilStr.includes("vulkanik");
  const isDeepPeat =
    soilStr.includes("> 3 m") ||
    soilStr.includes("> 2 m") ||
    soilStr.includes("dalam") ||
    soilStr.includes("kubah");
  const isPeat = Boolean(hotspot.peatland) || soilStr.includes("gambut");

  // Deterministic regional meteorology when live API omits wind telemetry
  const coordHash = Math.abs(Math.sin(hotspot.lat * 12.9898 + hotspot.lon * 78.233) * 43758.5453);
  const frac = coordHash - Math.floor(coordHash);

  const windSpeedKmh =
    hotspot.windSpeedKmh ??
    Math.round(
      isSavanna
        ? 22 + frac * 13 // Exposed savanna/karst corridors: 22–35 km/h
        : isPeat
        ? 14 + frac * 12 // Coastal & basin peat domes: 14–26 km/h
        : 9 + frac * 9 // Dense mineral canopy: 9–18 km/h
    );

  // Prevailing Indonesian dry-season monsoon vector (SE -> NW / WNW) modulated by local coastal/topographic phase
  const windDirectionDeg =
    hotspot.windDirectionDeg ??
    Math.round(((285 + (frac - 0.35) * 140) % 360 + 360) % 360);

  const windDirectionLabel = hotspot.windDirectionLabel ?? formatCompassAzimuth(windDirectionDeg);

  const humidityPct =
    hotspot.humidityPct ??
    Math.round(
      isSavanna ? 33 + frac * 12 : isDeepPeat ? 44 + frac * 10 : isPeat ? 48 + frac * 10 : 56 + frac * 12
    );

  // Fuel flammability index (0.0 - 1.0) combining fuel bed type, dNBR, FRP, and dryness
  const baseFuelFlammability = isDeepPeat
    ? 0.84
    : isSavanna
    ? 0.80
    : isPeat
    ? 0.72
    : 0.45;
  const dnbrBoost = Math.min(0.12, Math.max(0, (hotspot.dnbrMean ?? 0.45) - 0.35) * 0.28);
  const drynessBoost = Math.min(0.08, Math.max(0, (65 - humidityPct) / 400));
  const flammabilityIndex = Number(
    Math.min(
      0.98,
      Math.max(0.32, hotspot.flammabilityIndex ?? baseFuelFlammability + dnbrBoost + drynessBoost)
    ).toFixed(2)
  );

  const flammabilityLabel =
    flammabilityIndex >= 0.85
      ? "Sangat Mudah Terbakar (Ekstrem)"
      : flammabilityIndex >= 0.70
      ? "Mudah Terbakar (Tinggi)"
      : flammabilityIndex >= 0.55
      ? "Sedang"
      : "Rendah (Lembap/Mineral)";

  // Physical base radius from burned area (ha), cluster count, total FRP (MW), and fuel flammability
  const count = Math.max(1, hotspot.hotspotCount ?? 8);
  const areaHa = Math.max(8, hotspot.areaHa ?? 90);
  const frp = Math.max(5, hotspot.totalFrp ?? 60);

  // Equivalent circular radius in km: sqrt(Ha / (100 * pi)) = sqrt(Ha) * 0.0564 km
  // Scaled by cluster spatial dispersion (hotspotCount), radiative energy (totalFrp), and flammabilityIndex
  const eqRadiusKm = Math.sqrt(areaHa) * 0.16;
  const clusterDispersionKm = Math.pow(count, 0.38) * 0.42;
  const frpEnergyKm = Math.pow(frp, 0.35) * 0.18;
  const fuelMultiplier = 0.68 + 0.58 * flammabilityIndex;

  // Wide dynamic range: 0.95 km for small mineral fires up to 9.8 km for massive 300+ hotspot peat/savanna complexes
  const meanRadiusKm = Math.min(
    9.8,
    Math.max(0.95, (eqRadiusKm + clusterDispersionKm + frpEnergyKm) * fuelMultiplier * 0.55)
  );

  // Rothermel / Anderson wind-driven Length-to-Breadth ratio (L/B):
  // Savanna grass fuels elongate strongly with wind; deep peat smolders in broader multi-lobe domes
  const windFactor = Math.pow(windSpeedKmh / 12.0, 1.28);
  const fuelWindSensitivity = isSavanna ? 0.58 : isPeat ? 0.34 : 0.26;
  const lengthToBreadthRatio = Number(
    Math.min(2.85, Math.max(1.12, 1.0 + fuelWindSensitivity * windFactor)).toFixed(2)
  );

  const majorAxisKm = Number((meanRadiusKm * Math.sqrt(lengthToBreadthRatio)).toFixed(2));
  const minorAxisKm = Number((meanRadiusKm / Math.sqrt(lengthToBreadthRatio)).toFixed(2));

  return {
    windSpeedKmh,
    windDirectionDeg,
    windDirectionLabel,
    humidityPct,
    flammabilityIndex,
    flammabilityLabel,
    lengthToBreadthRatio,
    majorAxisKm,
    minorAxisKm,
  };
}

export interface Dinov3ZoneRing {
  tier: "OUTER_YELLOW" | "MID_AMBER" | "INNER_ORANGE" | "CORE_DEEPRED";
  label: string;
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  weight: number;
  dashArray?: string;
  radiusKm: number;
  majorAxisKm: number;
  minorAxisKm: number;
  windSpeedKmh: number;
  windDirectionLabel: string;
  flammabilityIndex: number;
  flammabilityLabel: string;
  positions: [number, number][];
}

/**
 * Generate 4 physics-informed DINOv3 BurnSeg coverage polygon rings around a hotspot/cluster.
 * Accounts for:
 * 1. Wind speed & direction (`windSpeedKmh`, `windDirectionDeg`): eccentric downwind plume elongation
 *    where outer thermal/smoke tiers stretch downwind while the deep-red ignition core stays anchored upwind.
 * 2. Surrounding fuel flammability (`flammabilityIndex`, `peatland`, `soil`): dry savanna forms sleek
 *    wind-driven ellipses; deep peatland forms broad, multi-lobed smoldering perimeters; wet mineral soil
 *    stays compact.
 * 3. Cluster telemetry (`areaHa`, `totalFrp`, `hotspotCount`, `dnbrMean`): produces a ~10x size contrast
 *    between small surface fires and massive multi-hundred-hotspot peat complexes.
 */
export function buildDinov3CoverageRings(
  hotspot: Pick<
    Hotspot,
    | "lat"
    | "lon"
    | "areaHa"
    | "hotspotCount"
    | "totalFrp"
    | "dnbrMean"
    | "riskScore"
    | "peatland"
    | "soil"
    | "fireType"
    | "windSpeedKmh"
    | "windDirectionDeg"
    | "windDirectionLabel"
    | "humidityPct"
    | "flammabilityIndex"
  >,
  zoom = 5
): Dinov3ZoneRing[] {
  const env = getHotspotEnvironment(hotspot);
  const count = Math.max(1, hotspot.hotspotCount ?? 8);
  const soilStr = `${hotspot.soil ?? ""} ${hotspot.fireType ?? ""}`.toLowerCase();
  const isSavanna = soilStr.includes("savana") || soilStr.includes("karst") || soilStr.includes("vulkanik");
  const isPeat = Boolean(hotspot.peatland) || soilStr.includes("gambut");

  // Smooth zoom-adaptive visual multiplier so relative size & shape differences remain clearly visible at national zoom
  // and converge to 1.0x (exact physical kilometers) at zoom >= 10.
  const zoomScale =
    zoom <= 4
      ? 11.5
      : zoom === 5
      ? 8.2
      : zoom === 6
      ? 5.4
      : zoom === 7
      ? 3.3
      : zoom === 8
      ? 2.0
      : zoom === 9
      ? 1.35
      : 1.0;

  const latDegPerKm = 1.0 / 110.574;
  const lonDegPerKm = 1.0 / (111.32 * Math.max(0.25, Math.cos((hotspot.lat * Math.PI) / 180)));

  // Convert meteorological azimuth (0° = North, 90° = East) to mathematical angle in radians (0 = East, pi/2 = North)
  const windRad = ((90 - env.windDirectionDeg) * Math.PI) / 180;
  const cosW = Math.cos(windRad);
  const sinW = Math.sin(windRad);

  // Deterministic morphological seed from coordinates for natural flanking lobes
  const morphPhase = (Math.abs(hotspot.lat * 37.0) + Math.abs(hotspot.lon * 19.0)) % (2 * Math.PI);
  const nPts = 24;

  // Multi-lobe irregularity amplitude: higher on deep peatland with many sub-epicenters, smoother on fast savanna plumes
  const peatLobeAmp = isPeat ? 0.14 + Math.min(0.10, Math.log10(count + 1) * 0.04) : 0.06;
  const flankLobeAmp = isSavanna ? 0.05 : 0.09 + Math.min(0.07, count / 1800);

  /**
   * Build an eccentric wind-oriented elliptical ring with fuel-dependent perimeter lobes.
   * @param tierFraction Radial scale of this severity zone relative to outer perimeter (e.g. 1.0, 0.70, 0.44, 0.22)
   * @param downwindShiftFactor How strongly this zone shifts downwind from the ignition core (0 = anchored at epicenter, 1 = max shift)
   */
  const makeRing = (tierFraction: number, downwindShiftFactor: number): [number, number][] => {
    const pts: [number, number][] = [];
    // Inner core is more circular; outer spread & smoke rings experience full wind elongation
    const tierLB = 1.0 + (env.lengthToBreadthRatio - 1.0) * (0.35 + 0.65 * tierFraction);
    const semiMajorKm = env.majorAxisKm * zoomScale * tierFraction;
    const semiMinorKm = (semiMajorKm / tierLB);

    // Eccentric downwind offset: the fire core stays near the upwind ignition point while outer zones stretch downwind
    const downwindOffsetKm =
      semiMajorKm * 0.34 * downwindShiftFactor * Math.min(1.0, ( tierLB - 1.0) / 1.15);

    for (let i = 0; i < nPts; i++) {
      // Local angle theta around the ellipse (theta = 0 points directly downwind)
      const theta = (2 * Math.PI * i) / nPts;

      // Asymmetric head-fire vs back-fire shaping + fuel-specific perimeter undulations
      const headBoost = 1.0 + 0.14 * Math.cos(theta) * downwindShiftFactor;
      const peatLobes =
        1.0 +
        peatLobeAmp * Math.cos(3 * theta + morphPhase) +
        flankLobeAmp * Math.sin(4 * theta - morphPhase * 0.7) +
        (isPeat ? 0.06 * Math.cos(5 * theta + morphPhase * 1.3) : 0);

      // Local ellipse coordinates (u = downwind axis, v = crosswind flanking axis)
      const uKm = downwindOffsetKm + semiMajorKm * Math.cos(theta) * headBoost * peatLobes;
      const vKm = semiMinorKm * Math.sin(theta) * peatLobes;

      // Rotate (u, v) by wind vector into geographic East (dLonKm) and North (dLatKm)
      const eastKm = uKm * cosW - vKm * sinW;
      const northKm = uKm * sinW + vKm * cosW;

      const dLat = northKm * latDegPerKm;
      const dLon = eastKm * lonDegPerKm;
      pts.push([Number((hotspot.lat + dLat).toFixed(5)), Number((hotspot.lon + dLon).toFixed(5))]);
    }
    return pts;
  };

  // Core fraction depends on dNBR & peat smoldering intensity (peat has a larger high-severity core)
  const coreFraction = isPeat ? 0.27 : 0.20;
  const innerFraction = isPeat ? 0.50 : 0.42;
  const midFraction = 0.73;

  return [
    {
      tier: "OUTER_YELLOW",
      label: "Zona Kuning — Sebaran Asap & Risiko Perambatan Angin (DINOv3)",
      fillColor: "#fde047",
      strokeColor: "#eab308",
      fillOpacity: 0.27,
      weight: 1.2,
      dashArray: "4 4",
      radiusKm: env.majorAxisKm,
      majorAxisKm: env.majorAxisKm,
      minorAxisKm: env.minorAxisKm,
      windSpeedKmh: env.windSpeedKmh,
      windDirectionLabel: env.windDirectionLabel,
      flammabilityIndex: env.flammabilityIndex,
      flammabilityLabel: env.flammabilityLabel,
      positions: makeRing(1.0, 1.0),
    },
    {
      tier: "MID_AMBER",
      label: "Zona Oranye-Kuning — Transisi Termal & Front Api (DINOv3)",
      fillColor: "#fb923c",
      strokeColor: "#f97316",
      fillOpacity: 0.40,
      weight: 1.2,
      radiusKm: Number((env.majorAxisKm * midFraction).toFixed(2)),
      majorAxisKm: Number((env.majorAxisKm * midFraction).toFixed(2)),
      minorAxisKm: Number((env.minorAxisKm * midFraction).toFixed(2)),
      windSpeedKmh: env.windSpeedKmh,
      windDirectionLabel: env.windDirectionLabel,
      flammabilityIndex: env.flammabilityIndex,
      flammabilityLabel: env.flammabilityLabel,
      positions: makeRing(midFraction, 0.72),
    },
    {
      tier: "INNER_ORANGE",
      label: "Zona Merah-Oranye — Area Terbakar Aktif (DINOv3)",
      fillColor: "#ef4444",
      strokeColor: "#dc2626",
      fillOpacity: 0.54,
      weight: 1.5,
      radiusKm: Number((env.majorAxisKm * innerFraction).toFixed(2)),
      majorAxisKm: Number((env.majorAxisKm * innerFraction).toFixed(2)),
      minorAxisKm: Number((env.minorAxisKm * innerFraction).toFixed(2)),
      windSpeedKmh: env.windSpeedKmh,
      windDirectionLabel: env.windDirectionLabel,
      flammabilityIndex: env.flammabilityIndex,
      flammabilityLabel: env.flammabilityLabel,
      positions: makeRing(innerFraction, 0.42),
    },
    {
      tier: "CORE_DEEPRED",
      label: "Zona Merah Tua — Episentrum Inti Kebakaran (DINOv3)",
      fillColor: "#991b1b",
      strokeColor: "#7f1d1d",
      fillOpacity: 0.78,
      weight: 1.8,
      radiusKm: Number((env.majorAxisKm * coreFraction).toFixed(2)),
      majorAxisKm: Number((env.majorAxisKm * coreFraction).toFixed(2)),
      minorAxisKm: Number((env.minorAxisKm * coreFraction).toFixed(2)),
      windSpeedKmh: env.windSpeedKmh,
      windDirectionLabel: env.windDirectionLabel,
      flammabilityIndex: env.flammabilityIndex,
      flammabilityLabel: env.flammabilityLabel,
      positions: makeRing(coreFraction, 0.12),
    },
  ];
}

export interface TacticalDeploymentPoint {
  code: "BASE" | "POS-1" | "POS-2" | "POS-3" | "POS-4" | "UDP-1";
  name: string;
  role:
    | "staging_base"
    | "anchor_upwind"
    | "flank_left"
    | "flank_right"
    | "cutline_downwind"
    | "aerial_core";
  lat: number;
  lon: number;
  assignedUnit: string;
  equipment: string;
  rationale: string;
  badgeColor: string;
}

export interface TacticalRouteSegment {
  id: string;
  name: string;
  fromCode: string;
  toCode: string;
  color: string;
  weight: number;
  dashArray?: string;
  distanceKm: number;
  etaMin: number;
  positions: [number, number][];
  arrowMidpoint: [number, number];
  arrowRotationDeg: number;
  description: string;
}

export interface TacticalAllocationPlan {
  clusterId: string;
  points: TacticalDeploymentPoint[];
  routes: TacticalRouteSegment[];
  /** Left & right perimeter flanking attack paths from Upwind Anchor (POS-1) -> Flanks (POS-2/3) -> Cutline (POS-4). */
  flankVectors: [number, number][][];
  /** Defensive firebreak cutline arc ahead of the downwind head fire (around POS-4). */
  cutlineArc: [number, number][];
}

function computeBearingDeg(from: [number, number], to: [number, number]): number {
  const dLat = to[0] - from[0];
  const dLon = (to[1] - from[1]) * Math.cos(((from[0] + to[0]) * 0.5 * Math.PI) / 180);
  const mathAngleDeg = (Math.atan2(dLat, dLon) * 180) / Math.PI;
  return (90 - mathAngleDeg + 360) % 360;
}

/**
 * Compute a request-by-request Perimeter Tactical Resource Allocation & Fleet Routing Plan around a fire cluster.
 * Never directs ground firefighters into the unreachable center (`CORE_DEEPRED`). Instead, positions
 * ground units around the outer perimeter based on wind direction, speed, fuel type, and settlement proximity:
 * - BASE: Staging Base / Posko Daops Manggala Agni & BPBD (origin of ground convoys and aerial units)
 * - POS-1: Upwind Safe Anchor & Staging Command Post (outside upwind tail, zero smoke)
 * - POS-2: Left Crosswind Flanking Attack Crew (pinching lateral perimeter inward)
 * - POS-3: Right Crosswind Flanking & Peat Canal-Blocking Crew (pinching opposite flank)
 * - POS-4: Downwind Firebreak Cutline & Settlement Defense (ahead of advancing head fire)
 * - UDP-1: Aerial / Drone Swarm Core Suppression (aerial-only drop zone over unreachable center)
 */
export function buildTacticalAllocationPlan(
  hotspot: Hotspot,
  zoom = 8
): TacticalAllocationPlan {
  const env = getHotspotEnvironment(hotspot);
  const zoomScale =
    zoom <= 4
      ? 11.5
      : zoom === 5
      ? 8.2
      : zoom === 6
      ? 5.4
      : zoom === 7
      ? 3.3
      : zoom === 8
      ? 2.0
      : zoom === 9
      ? 1.35
      : 1.0;

  const latDegPerKm = 1.0 / 110.574;
  const lonDegPerKm = 1.0 / (111.32 * Math.max(0.25, Math.cos((hotspot.lat * Math.PI) / 180)));

  const windRad = ((90 - env.windDirectionDeg) * Math.PI) / 180;
  const cosW = Math.cos(windRad);
  const sinW = Math.sin(windRad);

  const semiMajorKm = env.majorAxisKm * zoomScale;
  const semiMinorKm = semiMajorKm / env.lengthToBreadthRatio;
  const downwindOffsetKm =
    semiMajorKm * 0.34 * Math.min(1.0, (env.lengthToBreadthRatio - 1.0) / 1.15);

  const toLatLon = (uKm: number, vKm: number): [number, number] => {
    const eastKm = uKm * cosW - vKm * sinW;
    const northKm = uKm * sinW + vKm * cosW;
    return [
      Number((hotspot.lat + northKm * latDegPerKm).toFixed(5)),
      Number((hotspot.lon + eastKm * lonDegPerKm).toFixed(5)),
    ];
  };

  // BASE: Road staging origin upwind of POS-1
  const [baseLat, baseLon] = toLatLon(downwindOffsetKm - semiMajorKm * 1.65, -semiMinorKm * 0.28);
  const [pos1Lat, pos1Lon] = toLatLon(downwindOffsetKm - semiMajorKm * 1.04, 0);
  const [pos2Lat, pos2Lon] = toLatLon(downwindOffsetKm * 0.65, semiMinorKm * 1.08);
  const [pos3Lat, pos3Lon] = toLatLon(downwindOffsetKm * 0.65, -semiMinorKm * 1.08);
  const [pos4Lat, pos4Lon] = toLatLon(downwindOffsetKm + semiMajorKm * 1.26, 0);
  const [udp1Lat, udp1Lon] = toLatLon(downwindOffsetKm * 0.22, 0);

  // Route 1: Main Convoy Dispatch Route (BASE -> POS-1) with realistic road curve waypoints
  const convoyWp1 = toLatLon(downwindOffsetKm - semiMajorKm * 1.42, -semiMinorKm * 0.22);
  const convoyWp2 = toLatLon(downwindOffsetKm - semiMajorKm * 1.22, -semiMinorKm * 0.08);
  const convoyPath: [number, number][] = [
    [baseLat, baseLon],
    convoyWp1,
    convoyWp2,
    [pos1Lat, pos1Lon],
  ];

  // Route 2: Left Flank Perimeter Route (POS-1 -> POS-2 -> POS-4)
  const leftWp1 = toLatLon(downwindOffsetKm - semiMajorKm * 0.42, semiMinorKm * 0.88);
  const leftWp2 = toLatLon(downwindOffsetKm + semiMajorKm * 0.82, semiMinorKm * 0.86);
  const leftFlankPath: [number, number][] = [
    [pos1Lat, pos1Lon],
    leftWp1,
    [pos2Lat, pos2Lon],
    leftWp2,
    [pos4Lat, pos4Lon],
  ];

  // Route 3: Right Flank Perimeter Route (POS-1 -> POS-3 -> POS-4)
  const rightWp1 = toLatLon(downwindOffsetKm - semiMajorKm * 0.42, -semiMinorKm * 0.88);
  const rightWp2 = toLatLon(downwindOffsetKm + semiMajorKm * 0.82, -semiMinorKm * 0.86);
  const rightFlankPath: [number, number][] = [
    [pos1Lat, pos1Lon],
    rightWp1,
    [pos3Lat, pos3Lon],
    rightWp2,
    [pos4Lat, pos4Lon],
  ];

  // Route 4: Aerial / Drone Direct Core Corridor (BASE -> UDP-1)
  const aerialMid = toLatLon(downwindOffsetKm - semiMajorKm * 0.65, -semiMinorKm * 0.14);
  const aerialPath: [number, number][] = [
    [baseLat, baseLon],
    aerialMid,
    [udp1Lat, udp1Lon],
  ];

  // Build downwind defensive firebreak cutline arc blocking head-fire spread
  const cutlineArc: [number, number][] = [-0.68, -0.34, 0, 0.34, 0.68].map((vFrac) =>
    toLatLon(
      downwindOffsetKm + semiMajorKm * (1.26 - Math.abs(vFrac) * 0.22),
      semiMinorKm * vFrac * 1.38
    )
  );

  const isPeat = Boolean(hotspot.peatland);
  const convoyDistKm = Math.max(4.5, Number((hotspot.distanceKm || 18).toFixed(1)));
  const convoyEtaMin = Math.max(12, hotspot.etaMin || 28);
  const flankDistKm = Number(Math.max(2.4, env.majorAxisKm * 1.85).toFixed(1));
  const flankEtaMin = Math.max(8, Math.round(flankDistKm * 3.2));
  const aerialDistKm = Number(Math.max(3.2, env.majorAxisKm * 1.65).toFixed(1));

  const routes: TacticalRouteSegment[] = [
    {
      id: "route-convoy-main",
      name: "Rute Konvoi Utama (BASE → POS-1)",
      fromCode: "BASE",
      toCode: "POS-1",
      color: "#059669",
      weight: 3.5,
      distanceKm: convoyDistKm,
      etaMin: convoyEtaMin,
      positions: convoyPath,
      arrowMidpoint: convoyWp1,
      arrowRotationDeg: computeBearingDeg([baseLat, baseLon], [pos1Lat, pos1Lon]),
      description: `Jalur darat utama pengerahan Truk Tangki & Regu Manggala Agni dari Posko BASE menuju Titik Jangkar Aman (POS-1) membelakangi arah angin.`,
    },
    {
      id: "route-flank-left",
      name: "Rute Manuver Jepit Kiri (POS-1 → POS-2 → POS-4)",
      fromCode: "POS-1",
      toCode: "POS-4",
      color: "#2563eb",
      weight: 2.8,
      dashArray: "7 5",
      distanceKm: flankDistKm,
      etaMin: flankEtaMin,
      positions: leftFlankPath,
      arrowMidpoint: [pos2Lat, pos2Lon],
      arrowRotationDeg: computeBearingDeg(leftWp1, leftWp2),
      description: `Jalur gelar selang & manuver regu darat menyusuri tepi luar sayap kiri (POS-2) untuk menjepit kepala api menuju garis sekat depan (POS-4).`,
    },
    {
      id: "route-flank-right",
      name: "Rute Manuver Sayap Kanan & Sekat Kanal (POS-1 → POS-3 → POS-4)",
      fromCode: "POS-1",
      toCode: "POS-4",
      color: "#0891b2",
      weight: 2.8,
      dashArray: "7 5",
      distanceKm: flankDistKm,
      etaMin: flankEtaMin,
      positions: rightFlankPath,
      arrowMidpoint: [pos3Lat, pos3Lon],
      arrowRotationDeg: computeBearingDeg(rightWp1, rightWp2),
      description: `Jalur manuver regu gambut & pompa sekat kanal menyusuri perimeter luar sayap kanan (POS-3) menuju sekat bakar depan (POS-4).`,
    },
    {
      id: "route-aerial-core",
      name: "Koridor Lintas Udara & Drone (BASE → UDP-1)",
      fromCode: "BASE",
      toCode: "UDP-1",
      color: "#dc2626",
      weight: 2.4,
      dashArray: "3 6",
      distanceKm: aerialDistKm,
      etaMin: Math.max(4, Math.round(aerialDistKm * 0.9)),
      positions: aerialPath,
      arrowMidpoint: aerialMid,
      arrowRotationDeg: computeBearingDeg([baseLat, baseLon], [udp1Lat, udp1Lon]),
      description: `Vektor terbang langsung Swarm Drone & Helikopter Water Bombing menuju inti merah (UDP-1) yang mustahil ditembus regu darat.`,
    },
  ];

  const points: TacticalDeploymentPoint[] = [
    {
      code: "BASE",
      name: "Posko Daops / Titik Keberangkatan Armada (Staging Base)",
      role: "staging_base",
      lat: baseLat,
      lon: baseLon,
      assignedUnit: "Posko Lapangan Gabungan (Manggala Agni, BPBD, Helipad Taktis)",
      equipment: "Truk Tangki Cadangan, Depot Bahan Bakar, Stasiun Kendali Drone",
      rationale: `Titik kumpul & pemberangkatan seluruh armada (${convoyDistKm} km / ETA ${convoyEtaMin} menit ke garis perimeter). Terhubung langsung ke POS-1 melalui Rute Konvoi Utama.`,
      badgeColor: "#0f172a",
    },
    {
      code: "POS-1",
      name: "Titik Jangkar & Posko Taktis (Upwind Safe Entry)",
      role: "anchor_upwind",
      lat: pos1Lat,
      lon: pos1Lon,
      assignedUnit: "1 Regu Komando Manggala Agni + 2 Truk Suplai Air (10.000L)",
      equipment: "Posko IC, Pompa Induk Tekanan Tinggi, Manifold Selang Cabang",
      rationale: `Sisi upwind (membelakangi angin ${env.windDirectionLabel}) di luar perimeter kuning — bebas asap & radiasi panas, titik masuk paling aman untuk regu darat.`,
      badgeColor: "#059669",
    },
    {
      code: "POS-2",
      name: "Sektor Serang Sayap Kiri (Flanking Pinch)",
      role: "flank_left",
      lat: pos2Lat,
      lon: pos2Lon,
      assignedUnit: "2 Regu Serang Darat Manggala Agni (30 Personel)",
      equipment: "Selang 1.5 Inci, Nozzle Jet-Spray, Garu Tajam & Gepuk",
      rationale: "Menyerang tepi luar sayap kiri secara menyamping (flanking attack) sepanjang rute biru untuk menyempitkan lebar kepala api ke arah dalam.",
      badgeColor: "#2563eb",
    },
    {
      code: "POS-3",
      name: isPeat
        ? "Sektor Sayap Kanan & Sekat Kanal Gambut"
        : "Sektor Serang Sayap Kanan (Flanking Pinch)",
      role: "flank_right",
      lat: pos3Lat,
      lon: pos3Lon,
      assignedUnit: isPeat
        ? "2 Regu Manggala Agni + Tim Pembasahan Gambut"
        : "2 Regu Serang Darat BPBD / TNI-Polri",
      equipment: isPeat
        ? "Pompa Apung/Portable, Tombak Suntik Gambut (Peat Spear), Sekat Kanal"
        : "Pompa Punggung (Jet Shooter), Selang Serang & Sekop Api",
      rationale: isPeat
        ? `Memutus perambatan bara bawah permukaan pada ${hotspot.soil} dari sisi sayap kanan (rute sian) tanpa masuk ke jebakan inti gambut.`
        : "Menjepit perimeter luar sayap kanan berlawanan dengan POS-2 agar api tidak melebar.",
      badgeColor: "#0891b2",
    },
    {
      code: "POS-4",
      name: "Garis Sekat Bakar & Proteksi Permukiman (Downwind Cutline)",
      role: "cutline_downwind",
      lat: pos4Lat,
      lon: pos4Lon,
      assignedUnit: "2 Regu BPBD + Unit Alat Berat & Evakuasi Warga",
      equipment: "Bulldozer/Excavator Sekat Bakar, Tirai Air (Water Curtain)",
      rationale: `Berada di depan arah rambat angin (${env.windSpeedKmh} km/j → ${env.windDirectionLabel}) di luar zona kuning untuk memutus jalur kepala api sebelum mencapai permukiman (${hotspot.settlementKm} km).`,
      badgeColor: "#d97706",
    },
    {
      code: "UDP-1",
      name: "Zona Drop Udara — Inti Terkepung (Khusus Drone/Heli)",
      role: "aerial_core",
      lat: udp1Lat,
      lon: udp1Lon,
      assignedUnit: "Swarm 5 Drone Pemadam SIGAP + Helikopter Water Bombing",
      equipment: "Payload Retardant / Bambi Bucket 4.000L (0 Personel Darat)",
      rationale: `⚠️ DILARANG UNTUK REGU DARAT: Episentrum inti (${hotspot.totalFrp ?? 450} MW) terkepung api aktif 360°. Hanya unit udara/drone yang menjatuhkan air di titik ini melalui koridor udara.`,
      badgeColor: "#dc2626",
    },
  ];

  return {
    clusterId: hotspot.id,
    points,
    routes,
    flankVectors: [leftFlankPath, rightFlankPath],
    cutlineArc,
  };
}

export interface PeatlandOverlayPolygon {
  id: string;
  name: string;
  soil: string;
  district: string;
  areaHaLabel: string;
  positions: [number, number][];
}

interface KhgBasinSpec {
  id: string;
  name: string;
  soil: string;
  district: string;
  areaHaLabel: string;
  lat: number;
  lon: number;
  semiMajorKm: number;
  semiMinorKm: number;
  azimuthDeg: number;
}

/**
 * Official KLHK Kesatuan Hidrologis Gambut (KHG) hydrological peat basins across Indonesia.
 * Completely independent of fire hotspot locations — represents true regional peatland geography.
 */
const KHG_PEATLAND_BASINS: KhgBasinSpec[] = [
  {
    id: "khg-sebangau-kahayan",
    name: "KHG Sungai Sebangau – Sungai Kahayan",
    soil: "Gambut Ombrogen Dalam (4–8 m)",
    district: "Pulang Pisau & Kota Palangka Raya, Kalimantan Tengah",
    areaHaLabel: "568,700 Ha",
    lat: -2.52,
    lon: 113.92,
    semiMajorKm: 52,
    semiMinorKm: 28,
    azimuthDeg: 165,
  },
  {
    id: "khg-kahayan-kapuas",
    name: "KHG Sungai Kahayan – Sungai Kapuas (Ex-PLG Blok A/B/C)",
    soil: "Gambut Tropis Terdegradasi Kanal",
    district: "Kab. Kapuas, Kalimantan Tengah",
    areaHaLabel: "412,300 Ha",
    lat: -2.42,
    lon: 114.48,
    semiMajorKm: 46,
    semiMinorKm: 25,
    azimuthDeg: 172,
  },
  {
    id: "khg-mendawai-seruyan",
    name: "KHG Sungai Mendawai – Sungai Seruyan",
    soil: "Gambut Rawa Dalam & Hutan Kerangas",
    district: "Kab. Seruyan & Kotawaringin Timur, Kalimantan Tengah",
    areaHaLabel: "385,100 Ha",
    lat: -2.98,
    lon: 112.48,
    semiMajorKm: 44,
    semiMinorKm: 24,
    azimuthDeg: 155,
  },
  {
    id: "khg-arut-kumai",
    name: "KHG Sungai Arut – Sungai Kumai",
    soil: "Gambut Pesisir & Rawa Air Tawar",
    district: "Kab. Kotawaringin Barat, Kalimantan Tengah",
    areaHaLabel: "194,500 Ha",
    lat: -2.78,
    lon: 111.72,
    semiMajorKm: 32,
    semiMinorKm: 19,
    azimuthDeg: 140,
  },
  {
    id: "khg-kapuas-terentang",
    name: "KHG Sungai Kapuas – Sungai Terentang",
    soil: "Gambut Delta & Aluvial Rawa",
    district: "Kab. Kubu Raya, Kalimantan Barat",
    areaHaLabel: "310,400 Ha",
    lat: -0.38,
    lon: 109.58,
    semiMajorKm: 40,
    semiMinorKm: 24,
    azimuthDeg: 115,
  },
  {
    id: "khg-pawan-kepulu",
    name: "KHG Sungai Pawan – Sungai Kepulu",
    soil: "Gambut Dalam Pesisir Selatan",
    district: "Kab. Ketapang, Kalimantan Barat",
    areaHaLabel: "248,900 Ha",
    lat: -1.92,
    lon: 110.22,
    semiMajorKm: 36,
    semiMinorKm: 20,
    azimuthDeg: 150,
  },
  {
    id: "khg-sentarum-kapuas",
    name: "KHG Cekungan Danau Sentarum – Kapuas Hulu",
    soil: "Gambut Cekungan Banjir Musiman",
    district: "Kab. Kapuas Hulu, Kalimantan Barat",
    areaHaLabel: "215,000 Ha",
    lat: 0.84,
    lon: 112.15,
    semiMajorKm: 34,
    semiMinorKm: 21,
    azimuthDeg: 78,
  },
  {
    id: "khg-mahakam-kayan",
    name: "KHG Cekungan Mahakam Tengah (Semayang–Melintang)",
    soil: "Gambut Cekungan Danau Banjir",
    district: "Kab. Kutai Kartanegara, Kalimantan Timur",
    areaHaLabel: "265,800 Ha",
    lat: -0.28,
    lon: 116.38,
    semiMajorKm: 38,
    semiMinorKm: 23,
    azimuthDeg: 62,
  },
  {
    id: "khg-barito-negara",
    name: "KHG Sungai Barito – Sungai Negara (Rawa Amuntai)",
    soil: "Gambut Rawa Lebak & Aluvial",
    district: "Kab. Hulu Sungai Utara & Barito Kuala, Kalimantan Selatan",
    areaHaLabel: "162,000 Ha",
    lat: -2.62,
    lon: 115.05,
    semiMajorKm: 28,
    semiMinorKm: 17,
    azimuthDeg: 170,
  },
  {
    id: "khg-kampar-gaung",
    name: "KHG Semenanjung Kampar – Sungai Gaung",
    soil: "Kubah Gambut Ombrogen Sangat Dalam (6–12 m)",
    district: "Kab. Pelalawan & Indragiri Hilir, Riau",
    areaHaLabel: "684,200 Ha",
    lat: 0.24,
    lon: 102.72,
    semiMajorKm: 56,
    semiMinorKm: 32,
    azimuthDeg: 122,
  },
  {
    id: "khg-rokan-siak",
    name: "KHG Sungai Rokan – Sungai Siak Pesisir",
    soil: "Gambut Pesisir Selat Malaka",
    district: "Kab. Bengkalis, Siak & Kota Dumai, Riau",
    areaHaLabel: "492,000 Ha",
    lat: 1.32,
    lon: 101.68,
    semiMajorKm: 48,
    semiMinorKm: 26,
    azimuthDeg: 132,
  },
  {
    id: "khg-mendahara-batanghari",
    name: "KHG Sungai Mendahara – Sungai Batanghari (Berbak–Muaro Jambi)",
    soil: "Gambut Hutan Rawa Primer & Restorasi",
    district: "Kab. Muaro Jambi & Tanjung Jabung Timur, Jambi",
    areaHaLabel: "342,600 Ha",
    lat: -1.42,
    lon: 103.98,
    semiMajorKm: 42,
    semiMinorKm: 23,
    azimuthDeg: 112,
  },
  {
    id: "khg-sugihan-lumpur",
    name: "KHG Sungai Sugihan – Sungai Lumpur",
    soil: "Gambut Pesisir Timur & Kanal Perkebunan",
    district: "Kab. Ogan Komering Ilir (OKI), Sumatera Selatan",
    areaHaLabel: "618,500 Ha",
    lat: -2.92,
    lon: 105.55,
    semiMajorKm: 54,
    semiMinorKm: 30,
    azimuthDeg: 148,
  },
  {
    id: "khg-merang-kepayang",
    name: "KHG Sungai Merang – Sungai Ngirawan",
    soil: "Gambut Dalam Merang-Kepayang",
    district: "Kab. Musi Banyuasin, Sumatera Selatan",
    areaHaLabel: "238,000 Ha",
    lat: -2.08,
    lon: 104.22,
    semiMajorKm: 34,
    semiMinorKm: 20,
    azimuthDeg: 125,
  },
  {
    id: "khg-singkil-tripa",
    name: "KHG Rawa Tripa – Kluet – Singkil",
    soil: "Gambut Pesisir Barat Sumatera",
    district: "Kab. Nagan Raya & Aceh Singkil, Aceh",
    areaHaLabel: "185,400 Ha",
    lat: 2.52,
    lon: 97.78,
    semiMajorKm: 32,
    semiMinorKm: 16,
    azimuthDeg: 145,
  },
  {
    id: "khg-digul-mappi-maro",
    name: "KHG Sungai Digul – Sungai Mappi – Sungai Kumbe",
    soil: "Gambut Rawa Aluvial & Savana Basah Papua",
    district: "Kab. Mappi & Merauke, Papua Selatan",
    areaHaLabel: "890,000 Ha",
    lat: -7.18,
    lon: 139.88,
    semiMajorKm: 62,
    semiMinorKm: 35,
    azimuthDeg: 130,
  },
];

/**
 * Return Indonesia's hydrological peatland basins (KHG) as independent geographic polygons.
 * Unlike the old hotspot-coupled helper, these exist at fixed geographic coordinates across Indonesia
 * regardless of where fires occur.
 */
export function buildIndonesianPeatlandBasins(): PeatlandOverlayPolygon[] {
  const profile = [1.08, 1.18, 1.04, 0.92, 0.96, 1.14, 1.22, 1.05, 0.91, 1.06, 1.16, 0.98, 1.12, 1.02, 0.94, 1.08];

  return KHG_PEATLAND_BASINS.map((basin, bIdx) => {
    const latDegPerKm = 1.0 / 110.574;
    const lonDegPerKm = 1.0 / (111.32 * Math.max(0.25, Math.cos((basin.lat * Math.PI) / 180)));
    const rotRad = ((90 - basin.azimuthDeg) * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const phase = ((bIdx * 1.7) % (2 * Math.PI));

    const positions: [number, number][] = profile.map((mult, idx) => {
      const theta = (2 * Math.PI * idx) / profile.length + phase;
      const uKm = basin.semiMajorKm * Math.cos(theta) * mult;
      const vKm = basin.semiMinorKm * Math.sin(theta) * mult;
      const eastKm = uKm * cosR - vKm * sinR;
      const northKm = uKm * sinR + vKm * cosR;
      return [
        Number((basin.lat + northKm * latDegPerKm).toFixed(4)),
        Number((basin.lon + eastKm * lonDegPerKm).toFixed(4)),
      ];
    });

    return {
      id: basin.id,
      name: basin.name,
      soil: basin.soil,
      district: basin.district,
      areaHaLabel: basin.areaHaLabel,
      positions,
    };
  });
}

export interface SettlementOverlayItem {
  id: string;
  name: string;
  placeType: string;
  province: string;
  lat: number;
  lon: number;
  nearestFireKm: number | null;
  population: string;
  bufferRadiusKm: number;
  bufferPositions: [number, number][];
}

interface IndonesianSettlementSpec {
  id: string;
  name: string;
  placeType: string;
  province: string;
  lat: number;
  lon: number;
  population: string;
  bufferRadiusKm: number;
}

/**
 * Independent geographic catalog of real Indonesian cities, regency capitals, and major rural settlements.
 * Exists at fixed real-world GPS coordinates independent of where fire clusters appear.
 */
const INDONESIAN_SETTLEMENTS: IndonesianSettlementSpec[] = [
  // Sumatera
  { id: "stl-medan", name: "Kota Medan", placeType: "Kota Metropolitan", province: "Sumatera Utara", lat: 3.5952, lon: 98.6722, population: "2.4 Juta Jiwa", bufferRadiusKm: 12 },
  { id: "stl-banda-aceh", name: "Kota Banda Aceh", placeType: "Ibu Kota Provinsi", province: "Aceh", lat: 5.5483, lon: 95.3238, population: "255 Ribu Jiwa", bufferRadiusKm: 8 },
  { id: "stl-meulaboh", name: "Kota Meulaboh", placeType: "Ibu Kota Kabupaten", province: "Aceh Barat", lat: 4.1363, lon: 96.1267, population: "65 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-pekanbaru", name: "Kota Pekanbaru", placeType: "Ibu Kota Provinsi", province: "Riau", lat: 0.5071, lon: 101.4478, population: "1.1 Juta Jiwa", bufferRadiusKm: 11 },
  { id: "stl-dumai", name: "Kota Dumai", placeType: "Kota Pelabuhan & Industri", province: "Riau", lat: 1.6667, lon: 101.4500, population: "320 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-pangkalan-kerinci", name: "Pangkalan Kerinci", placeType: "Ibu Kota Kabupaten", province: "Pelalawan, Riau", lat: 0.4022, lon: 101.8551, population: "110 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-tembilahan", name: "Kota Tembilahan", placeType: "Ibu Kota Kabupaten", province: "Indragiri Hilir, Riau", lat: -0.3204, lon: 103.1560, population: "85 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-padang", name: "Kota Padang", placeType: "Ibu Kota Provinsi", province: "Sumatera Barat", lat: -0.9471, lon: 100.4172, population: "940 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-jambi", name: "Kota Jambi", placeType: "Ibu Kota Provinsi", province: "Jambi", lat: -1.6101, lon: 103.6131, population: "620 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-palembang", name: "Kota Palembang", placeType: "Kota Metropolitan", province: "Sumatera Selatan", lat: -2.9761, lon: 104.7754, population: "1.7 Juta Jiwa", bufferRadiusKm: 12 },
  { id: "stl-kayuagung", name: "Kota Kayuagung (OKI)", placeType: "Ibu Kota Kabupaten", province: "Sumatera Selatan", lat: -3.3917, lon: 104.8306, population: "78 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-sekayu", name: "Kota Sekayu (Muba)", placeType: "Ibu Kota Kabupaten", province: "Sumatera Selatan", lat: -2.8872, lon: 103.8342, population: "92 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-bandar-lampung", name: "Kota Bandar Lampung", placeType: "Ibu Kota Provinsi", province: "Lampung", lat: -5.3971, lon: 105.2668, population: "1.2 Juta Jiwa", bufferRadiusKm: 10 },
  // Kalimantan
  { id: "stl-pontianak", name: "Kota Pontianak", placeType: "Ibu Kota Provinsi", province: "Kalimantan Barat", lat: -0.0263, lon: 109.3425, population: "675 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-ketapang", name: "Kota Ketapang", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Barat", lat: -1.8381, lon: 109.9722, population: "95 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-sintang", name: "Kota Sintang", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Barat", lat: 0.0681, lon: 111.4981, population: "76 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-putussibau", name: "Putussibau", placeType: "Ibu Kota Kabupaten", province: "Kapuas Hulu, Kalbar", lat: 0.8617, lon: 112.9258, population: "52 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-palangkaraya", name: "Kota Palangka Raya", placeType: "Ibu Kota Provinsi", province: "Kalimantan Tengah", lat: -2.2136, lon: 113.9108, population: "305 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-pulang-pisau", name: "Kota Pulang Pisau", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Tengah", lat: -2.7538, lon: 114.2672, population: "48 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-kuala-kapuas", name: "Kuala Kapuas", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Tengah", lat: -3.0094, lon: 114.3878, population: "82 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-sampit", name: "Kota Sampit (Kotim)", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Tengah", lat: -2.5325, lon: 112.9508, population: "165 Ribu Jiwa", bufferRadiusKm: 8 },
  { id: "stl-kuala-pembuang", name: "Kuala Pembuang (Seruyan)", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Tengah", lat: -3.3886, lon: 112.5447, population: "42 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-pangkalan-bun", name: "Pangkalan Bun (Kobar)", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Tengah", lat: -2.6833, lon: 111.6167, population: "120 Ribu Jiwa", bufferRadiusKm: 8 },
  { id: "stl-banjarmasin", name: "Kota Banjarmasin", placeType: "Kota Metropolitan", province: "Kalimantan Selatan", lat: -3.3194, lon: 114.5908, population: "675 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-banjarbaru", name: "Kota Banjarbaru", placeType: "Ibu Kota Provinsi", province: "Kalimantan Selatan", lat: -3.4420, lon: 114.8318, population: "270 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-balikpapan", name: "Kota Balikpapan", placeType: "Kota Industri & Pelabuhan", province: "Kalimantan Timur", lat: -1.2379, lon: 116.8529, population: "730 Ribu Jiwa", bufferRadiusKm: 10 },
  { id: "stl-samarinda", name: "Kota Samarinda", placeType: "Ibu Kota Provinsi", province: "Kalimantan Timur", lat: -0.5022, lon: 117.1536, population: "860 Ribu Jiwa", bufferRadiusKm: 11 },
  { id: "stl-tanjung-redeb", name: "Tanjung Redeb (Berau)", placeType: "Ibu Kota Kabupaten", province: "Kalimantan Timur", lat: 2.1506, lon: 117.4958, population: "74 Ribu Jiwa", bufferRadiusKm: 7 },
  { id: "stl-tarakan", name: "Kota Tarakan", placeType: "Kota Provinsi", province: "Kalimantan Utara", lat: 3.3000, lon: 117.6333, population: "245 Ribu Jiwa", bufferRadiusKm: 8 },
  // Jawa, Bali, Nusa Tenggara, Sulawesi, Maluku, Papua
  { id: "stl-jakarta", name: "DKI Jakarta", placeType: "Megapolitan", province: "DKI Jakarta", lat: -6.2088, lon: 106.8456, population: "10.6 Juta Jiwa", bufferRadiusKm: 15 },
  { id: "stl-surabaya", name: "Kota Surabaya", placeType: "Ibu Kota Provinsi", province: "Jawa Timur", lat: -7.2575, lon: 112.7521, population: "2.9 Juta Jiwa", bufferRadiusKm: 13 },
  { id: "stl-denpasar", name: "Kota Denpasar", placeType: "Ibu Kota Provinsi", province: "Bali", lat: -8.6705, lon: 115.2126, population: "725 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-kupang", name: "Kota Kupang", placeType: "Ibu Kota Provinsi", province: "Nusa Tenggara Timur", lat: -10.1772, lon: 123.6070, population: "445 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-waingapu", name: "Kota Waingapu", placeType: "Ibu Kota Kabupaten", province: "Sumba Timur, NTT", lat: -9.6567, lon: 120.2642, population: "62 Ribu Jiwa", bufferRadiusKm: 6 },
  { id: "stl-makassar", name: "Kota Makassar", placeType: "Ibu Kota Provinsi", province: "Sulawesi Selatan", lat: -5.1477, lon: 119.4327, population: "1.5 Juta Jiwa", bufferRadiusKm: 11 },
  { id: "stl-palu", name: "Kota Palu", placeType: "Ibu Kota Provinsi", province: "Sulawesi Tengah", lat: -0.8917, lon: 119.8707, population: "385 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-kendari", name: "Kota Kendari", placeType: "Ibu Kota Provinsi", province: "Sulawesi Tenggara", lat: -3.9985, lon: 122.5130, population: "355 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-manado", name: "Kota Manado", placeType: "Ibu Kota Provinsi", province: "Sulawesi Utara", lat: 1.4748, lon: 124.8421, population: "455 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-ambon", name: "Kota Ambon", placeType: "Ibu Kota Provinsi", province: "Maluku", lat: -3.6954, lon: 128.1814, population: "350 Ribu Jiwa", bufferRadiusKm: 8 },
  { id: "stl-jayapura", name: "Kota Jayapura", placeType: "Ibu Kota Provinsi", province: "Papua", lat: -2.5337, lon: 140.7181, population: "410 Ribu Jiwa", bufferRadiusKm: 9 },
  { id: "stl-merauke", name: "Kota Merauke", placeType: "Ibu Kota Provinsi", province: "Papua Selatan", lat: -8.4932, lon: 140.4018, population: "105 Ribu Jiwa", bufferRadiusKm: 8 },
];

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * 6371.0 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Return real Indonesian cities and regency settlements at fixed geographic coordinates,
 * completely independent of where fire clusters occur. Computes distance to the nearest active fire if any exist.
 */
export function buildIndonesianSettlementZones(
  hotspots: Hotspot[] = []
): SettlementOverlayItem[] {
  return INDONESIAN_SETTLEMENTS.map((stl) => {
    const latDegPerKm = 1.0 / 110.574;
    const lonDegPerKm = 1.0 / (111.32 * Math.max(0.25, Math.cos((stl.lat * Math.PI) / 180)));
    const nPts = 16;
    const bufferPositions: [number, number][] = [];
    for (let i = 0; i < nPts; i++) {
      const a = (2 * Math.PI * i) / nPts;
      bufferPositions.push([
        Number((stl.lat + stl.bufferRadiusKm * Math.sin(a) * latDegPerKm).toFixed(4)),
        Number((stl.lon + stl.bufferRadiusKm * Math.cos(a) * lonDegPerKm).toFixed(4)),
      ]);
    }

    let minKm: number | null = null;
    for (const h of hotspots) {
      const dKm = haversineKm([stl.lat, stl.lon], [h.lat, h.lon]);
      if (minKm === null || dKm < minKm) {
        minKm = dKm;
      }
    }

    return {
      id: stl.id,
      name: stl.name,
      placeType: stl.placeType,
      province: stl.province,
      lat: stl.lat,
      lon: stl.lon,
      nearestFireKm: minKm !== null ? Number(minKm.toFixed(1)) : null,
      population: stl.population,
      bufferRadiusKm: stl.bufferRadiusKm,
      bufferPositions,
    };
  });
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
  /** Count of hotspots extinguished by this drone during the simulation. */
  extinguishedCount?: number;
}

const INDONESIAN_SPAWN_ZONES: Array<{ region: string; latRange: [number, number]; lonRange: [number, number] }> = [
  { region: "Sumatera Utara & Aceh", latRange: [1.5, 4.2], lonRange: [97.2, 99.6] },
  { region: "Riau & Jambi (Sumatera)", latRange: [-1.8, 1.4], lonRange: [101.0, 103.8] },
  { region: "Sumatera Selatan & Lampung", latRange: [-4.8, -2.4], lonRange: [103.2, 105.6] },
  { region: "Kalimantan Barat", latRange: [-2.2, 0.8], lonRange: [109.4, 111.8] },
  { region: "Kalimantan Tengah", latRange: [-3.1, -0.8], lonRange: [112.0, 114.6] },
  { region: "Kalimantan Timur & Selatan", latRange: [-3.3, 1.2], lonRange: [114.8, 117.4] },
  { region: "Jawa Barat & Tengah", latRange: [-7.6, -6.3], lonRange: [106.8, 110.8] },
  { region: "Jawa Timur & Bali", latRange: [-8.5, -7.2], lonRange: [111.8, 115.4] },
  { region: "Sulawesi Selatan & Tengah", latRange: [-5.1, -0.9], lonRange: [119.4, 121.8] },
  { region: "Nusa Tenggara (NTB / NTT)", latRange: [-10.1, -8.4], lonRange: [116.5, 124.5] },
  { region: "Papua Selatan & Maluku", latRange: [-8.4, -3.2], lonRange: [128.0, 140.5] },
];

function randomBetween(min: number, max: number): number {
  return Number((min + Math.random() * (max - min)).toFixed(4));
}

/**
 * Spawn 5 autonomous firefighting drones at random locations across the Indonesian archipelago
 * and assign them to active priority fire clusters.
 */
export function createDrones(priorityHotspots?: Hotspot[], count = 5): Drone[] {
  const pool = [...INDONESIAN_SPAWN_ZONES].sort(() => Math.random() - 0.5);
  const targets = priorityHotspots && priorityHotspots.length > 0 ? priorityHotspots : SAMPLE_HOTSPOTS;
  const labels = ["A", "B", "C", "D", "E", "F", "G"];

  return Array.from({ length: count }, (_, idx) => {
    const zone = pool[idx % pool.length];
    const startLat = randomBetween(zone.latRange[0], zone.latRange[1]);
    const startLon = randomBetween(zone.lonRange[0], zone.lonRange[1]);
    const assignedTarget = targets[idx % targets.length] ?? null;

    return {
      id: `DRN-0${idx + 1}`,
      name: `Drone ${labels[idx] ?? idx + 1}`,
      lat: startLat,
      lon: startLon,
      base: [startLat, startLon],
      baseName: `Posko Udara ${zone.region}`,
      targetId: assignedTarget?.id ?? null,
      mode: assignedTarget ? "Menuju target" : "Siaga",
      battery: 100,
      extinguisherL: 60,
      extinguisherCapacityL: 60,
      extinguishedCount: 0,
    };
  });
}

const BASE_STEP_DEG = 0.14;

function moveToward(
  d: Drone,
  lat: number,
  lon: number,
  stepDeg = BASE_STEP_DEG
): { lat: number; lon: number; arrived: boolean } {
  const dLat = lat - d.lat;
  const dLon = lon - d.lon;
  const dist = Math.hypot(dLat, dLon);
  // Adaptive long-range cruise speed so drones starting across Indonesia reach distant islands briskly
  const adaptiveStep = dist > 8.0 ? stepDeg * 3.4 : dist > 3.5 ? stepDeg * 2.1 : stepDeg;
  if (dist <= adaptiveStep) return { lat, lon, arrived: true };
  return {
    lat: Number((d.lat + (dLat / dist) * adaptiveStep).toFixed(4)),
    lon: Number((d.lon + (dLon / dist) * adaptiveStep).toFixed(4)),
    arrived: false,
  };
}

/**
 * Pick the next best active hotspot for an available drone, preferring unassigned high-risk fires
 * or the closest remaining fire.
 */
function pickNextTarget(drone: Drone, hotspots: Hotspot[], assignedIds: Set<string>): Hotspot | null {
  if (hotspots.length === 0) return null;
  const unassigned = hotspots.filter((h) => !assignedIds.has(h.id));
  const candidates = unassigned.length > 0 ? unassigned : hotspots;
  return [...candidates].sort((a, b) => {
    const distA = Math.hypot(a.lat - drone.lat, a.lon - drone.lon);
    const distB = Math.hypot(b.lat - drone.lat, b.lon - drone.lon);
    // Balance MCDA risk score with proximity
    return b.riskScore - distB * 2.2 - (a.riskScore - distA * 2.2);
  })[0];
}

export interface SimulationStepResult {
  drones: Drone[];
  hotspots: Hotspot[];
}

/**
 * Advance the multi-drone firefighting simulation by one tick:
 * - Drones cruise from their random Indonesian starting locations to their assigned hotspots.
 * - When in "Memadamkan" mode, each drone drops retardant payload that actively reduces
 *   the target hotspot's `areaHa`, `totalFrp`, `hotspotCount`, `dnbrMean`, and `riskScore`,
 *   visibly shrinking its DINOv3 fire coverage rings on the map.
 * - Once a hotspot's area/intensity drops below threshold, the fire is completely extinguished
 *   (removed from `hotspots`) and the drone retasks to the next active fire.
 */
export function stepSimulation(drones: Drone[], hotspots: Hotspot[]): SimulationStepResult {
  const hotspotMap = new Map<string, Hotspot>(hotspots.map((h) => [h.id, { ...h }]));
  const extinguishedIds = new Set<string>();
  const assignedIds = new Set<string>(
    drones.map((d) => d.targetId).filter((id): id is string => Boolean(id))
  );

  const nextDrones = drones.map((d, idx) => {
    // 1. Returning to base to recharge & refill
    if (d.mode === "Kembali ke base") {
      const next = moveToward(d, d.base[0], d.base[1], BASE_STEP_DEG * 1.25);
      if (next.arrived) {
        const remainingHotspots = Array.from(hotspotMap.values()).filter(
          (h) => !extinguishedIds.has(h.id)
        );
        const nextTarget = pickNextTarget(d, remainingHotspots, assignedIds);
        if (nextTarget) assignedIds.add(nextTarget.id);
        return {
          ...d,
          lat: next.lat,
          lon: next.lon,
          mode: (nextTarget ? "Menuju target" : "Siaga") as DroneMode,
          targetId: nextTarget?.id ?? null,
          battery: 100,
          extinguisherL: d.extinguisherCapacityL,
        };
      }
      return {
        ...d,
        lat: next.lat,
        lon: next.lon,
        battery: Math.round(Math.max(5, d.battery - 0.3) * 10) / 10,
      };
    }

    let target = d.targetId ? hotspotMap.get(d.targetId) : undefined;

    // 2. If target was already extinguished or drone is idle while fires remain, retask immediately
    if (!target || extinguishedIds.has(target.id)) {
      const remainingHotspots = Array.from(hotspotMap.values()).filter(
        (h) => !extinguishedIds.has(h.id)
      );
      if (remainingHotspots.length === 0) {
        return { ...d, targetId: null, mode: "Siaga" as DroneMode };
      }
      if (d.battery < 22 || d.extinguisherL <= 4) {
        return { ...d, targetId: null, mode: "Kembali ke base" as DroneMode };
      }
      const nextTarget = pickNextTarget(d, remainingHotspots, assignedIds);
      if (!nextTarget) {
        return { ...d, targetId: null, mode: "Siaga" as DroneMode };
      }
      assignedIds.add(nextTarget.id);
      target = nextTarget;
      return {
        ...d,
        targetId: target.id,
        mode: "Menuju target" as DroneMode,
      };
    }

    // 3. Check battery / payload reserves
    if (d.battery < 18 || d.extinguisherL <= 0) {
      return { ...d, mode: "Kembali ke base" as DroneMode };
    }

    // 4. Actively extinguishing the fire
    if (d.mode === "Memadamkan") {
      const dropL = Math.min(d.extinguisherL, 4.5);
      const hoverDrain = 0.5;
      const newPayload = Math.round(Math.max(0, d.extinguisherL - dropL) * 10) / 10;
      const newBattery = Math.round(Math.max(0, d.battery - hoverDrain) * 10) / 10;

      // Apply suppression effect to the target hotspot
      const peatFactor = target.peatland ? 0.88 : 0.82; // Peat smolders slightly longer than surface savanna
      const newAreaHa = Math.max(0, Math.round(target.areaHa * peatFactor - 9));
      const newFrp = Math.max(0, Number(((target.totalFrp ?? 80) * peatFactor - 24).toFixed(1)));
      const newCount = Math.max(0, Math.floor((target.hotspotCount ?? 10) * peatFactor) - 2);
      const newDnbr = Number(Math.max(0.12, target.dnbrMean * 0.92 - 0.02).toFixed(2));
      const newRisk = Number(Math.max(0, target.riskScore - (target.peatland ? 6.5 : 8.5)).toFixed(1));

      // Check if fire is completely extinguished
      if (newAreaHa <= 10 || newFrp <= 10 || newRisk <= 22 || newCount <= 0) {
        extinguishedIds.add(target.id);
        hotspotMap.delete(target.id);

        const remainingHotspots = Array.from(hotspotMap.values()).filter(
          (h) => !extinguishedIds.has(h.id)
        );
        const nextTarget =
          newBattery >= 25 && newPayload >= 10
            ? pickNextTarget(d, remainingHotspots, assignedIds)
            : null;
        if (nextTarget) assignedIds.add(nextTarget.id);

        return {
          ...d,
          lat: target.lat,
          lon: target.lon,
          battery: newBattery,
          extinguisherL: newPayload,
          extinguishedCount: (d.extinguishedCount ?? 0) + 1,
          targetId: nextTarget?.id ?? null,
          mode: (nextTarget
            ? "Menuju target"
            : remainingHotspots.length > 0
            ? "Kembali ke base"
            : "Siaga") as DroneMode,
        };
      }

      const newSeverity: Severity =
        newRisk >= 70 ? "tinggi" : newRisk >= 45 ? "sedang" : "rendah";

      hotspotMap.set(target.id, {
        ...target,
        areaHa: newAreaHa,
        totalFrp: newFrp,
        hotspotCount: newCount,
        dnbrMean: newDnbr,
        riskScore: newRisk,
        severity: newSeverity,
        status: `Sedang dipadamkan (${d.name})`,
        lastCondition: `Supresi aktif (${newCount} titik tersisa, FRP ${newFrp} MW)`,
      });

      // Slight orbital patrol over the fire perimeter while dropping retardant
      const orbitAngle = (Date.now() / 450 + idx * 1.3) % (2 * Math.PI);
      return {
        ...d,
        lat: Number((target.lat + Math.sin(orbitAngle) * 0.018).toFixed(4)),
        lon: Number((target.lon + Math.cos(orbitAngle) * 0.018).toFixed(4)),
        battery: newBattery,
        extinguisherL: newPayload,
      };
    }

    // 5. En route to target hotspot
    const urgencyStep = BASE_STEP_DEG * (target.riskScore >= 85 ? 1.25 : 1.0);
    const next = moveToward(d, target.lat, target.lon, urgencyStep);
    return {
      ...d,
      lat: next.lat,
      lon: next.lon,
      mode: (next.arrived ? "Memadamkan" : "Menuju target") as DroneMode,
      battery: Math.round(Math.max(0, d.battery - 0.35) * 10) / 10,
    };
  });

  return {
    drones: nextDrones,
    hotspots: Array.from(hotspotMap.values()),
  };
}

/** Single-drone step helper kept for backwards compatibility. */
export function stepDrone(d: Drone, hotspots: Hotspot[]): Drone {
  return stepSimulation([d], hotspots).drones[0];
}

