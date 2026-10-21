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
    lat: -0.93,
    lon: 115.05,
    severity: "tinggi",
    riskScore: 93.8,
    distanceKm: 12,
    etaMin: 18,
    areaHa: 312,
    dnbrMean: 0.71,
    imagery: "2 Okt / 18 Okt 2026 (awan 8%)",
    peatland: true,
    settlementKm: 0.8,
    status: "Terkonfirmasi citra",
    location: "Batu Raya II, Kecamatan Gunung Timang, Kabupaten Barito Utara",
    fireType: "Permukaan",
    soil: "Mineral",
    lastCondition: "Api belum padam",
    satellite: "NASA-MODIS",
  },
  {
    id: "HS-0398",
    lat: -2.85,
    lon: 114.12,
    severity: "tinggi",
    riskScore: 91.2,
    distanceKm: 21,
    etaMin: 42,
    areaHa: 128,
    dnbrMean: 0.58,
    imagery: "3 Okt / 19 Okt 2026 (awan 4%)",
    peatland: true,
    settlementKm: 1.4,
    status: "Terkonfirmasi lapangan",
    location: "Desa Bereng Bengkel, Kecamatan Sebangau Kuala, Kabupaten Pulang Pisau",
    fireType: "Bawah permukaan (gambut)",
    soil: "Gambut dalam > 3 m",
    lastCondition: "Api membara di kanal",
    satellite: "VIIRS S-NPP",
  },
  {
    id: "HS-0421",
    lat: 0.35,
    lon: 115.7,
    severity: "tinggi",
    riskScore: 86.5,
    distanceKm: 38,
    etaMin: 55,
    areaHa: 96,
    dnbrMean: 0.52,
    imagery: "5 Okt / 19 Okt 2026 (awan 12%)",
    peatland: false,
    settlementKm: 3.2,
    status: "Perlu cek lapangan",
    location: "Kecamatan Long Iram, Kabupaten Kutai Barat",
    fireType: "Permukaan",
    soil: "Mineral",
    lastCondition: "Asap tebal terpantau",
    satellite: "VIIRS NOAA-20",
  },
  {
    id: "HS-0405",
    lat: -2.31,
    lon: 114.38,
    severity: "tinggi",
    riskScore: 82.1,
    distanceKm: 27,
    etaMin: 47,
    areaHa: 74,
    dnbrMean: 0.49,
    imagery: "4 Okt / 18 Okt 2026 (awan 6%)",
    peatland: true,
    settlementKm: 2.1,
    status: "Terkonfirmasi citra",
    location: "Kecamatan Mantangai, Kabupaten Kapuas",
    fireType: "Permukaan & gambut",
    soil: "Gambut 1-2 m",
    lastCondition: "Api meluas ke arah timur",
    satellite: "NASA-MODIS",
  },
  {
    id: "HS-0417",
    lat: 0.12,
    lon: 116.42,
    severity: "tinggi",
    riskScore: 78.4,
    distanceKm: 44,
    etaMin: 63,
    areaHa: 51,
    dnbrMean: 0.46,
    imagery: "5 Okt / 20 Okt 2026 (awan 15%)",
    peatland: false,
    settlementKm: 4.6,
    status: "Perlu cek lapangan",
    location: "Kecamatan Kembang Janggut, Kabupaten Kutai Kartanegara",
    fireType: "Permukaan",
    soil: "Mineral",
    lastCondition: "Belum ada laporan lapangan",
    satellite: "VIIRS S-NPP",
  },
  {
    id: "HS-0430",
    lat: 1.62,
    lon: 116.28,
    severity: "tinggi",
    riskScore: 75.9,
    distanceKm: 61,
    etaMin: 95,
    areaHa: 38,
    dnbrMean: 0.44,
    imagery: "6 Okt / 20 Okt 2026 (awan 18%)",
    peatland: false,
    settlementKm: 6.3,
    status: "Belum terverifikasi",
    location: "Kecamatan Kelay, Kabupaten Berau",
    fireType: "Permukaan",
    soil: "Mineral",
    lastCondition: "Belum ada laporan lapangan",
    satellite: "NASA-MODIS",
  },
  {
    id: "HS-0388",
    lat: -2.02,
    lon: 113.21,
    severity: "sedang",
    riskScore: 61.3,
    distanceKm: 33,
    etaMin: 58,
    areaHa: 22,
    dnbrMean: 0.31,
    imagery: "4 Okt / 19 Okt 2026 (awan 9%)",
    peatland: true,
    settlementKm: 5.4,
    status: "Perlu cek lapangan",
    location: "Kecamatan Kamipang, Kabupaten Katingan",
    fireType: "Permukaan",
    soil: "Gambut < 1 m",
    lastCondition: "Api kecil, sebagian padam",
    satellite: "VIIRS NOAA-20",
  },
  {
    id: "HS-0379",
    lat: -3.32,
    lon: 115.02,
    severity: "rendah",
    riskScore: 38.7,
    distanceKm: 18,
    etaMin: 31,
    areaHa: 6,
    dnbrMean: 0.14,
    imagery: "2 Okt / 17 Okt 2026 (awan 22%)",
    peatland: false,
    settlementKm: 7.9,
    status: "Belum terverifikasi",
    location: "Kecamatan Aranio, Kabupaten Banjar",
    fireType: "Permukaan",
    soil: "Mineral",
    lastCondition: "Kemungkinan pembakaran lahan terkendali",
    satellite: "NASA-MODIS",
  },
];

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
  { name: "Indonesia", lat: -1.5, lon: 117.5, zoom: 5 },
  { name: "Kalimantan Tengah", lat: -1.68, lon: 113.38, zoom: 7 },
  { name: "Kalimantan Timur", lat: 0.54, lon: 116.42, zoom: 7 },
  { name: "Kalimantan Barat", lat: -0.28, lon: 111.48, zoom: 7 },
  { name: "Kalimantan Selatan", lat: -3.09, lon: 115.28, zoom: 8 },
  { name: "Palangka Raya", lat: -2.21, lon: 113.92, zoom: 10 },
  { name: "Pulang Pisau", lat: -2.75, lon: 114.26, zoom: 9 },
  { name: "Barito Utara", lat: -0.96, lon: 115.09, zoom: 9 },
  { name: "Riau", lat: 0.29, lon: 101.71, zoom: 7 },
  { name: "Pekanbaru", lat: 0.51, lon: 101.45, zoom: 10 },
  { name: "Sumatera Selatan", lat: -3.32, lon: 103.91, zoom: 7 },
  { name: "Jambi", lat: -1.61, lon: 103.61, zoom: 8 },
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

