import type { Investigation } from "@/lib/types";
import { SAMPLE_HOTSPOTS, type Hotspot } from "@/lib/monitoring";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MonitoringHotspotsResponse {
  is_live: boolean;
  source: string;
  total_raw_hotspots: number;
  cluster_count: number;
  updated_at: string;
  hotspots: Hotspot[];
}

/** Guess the target region from a free-text prompt for the offline fallback. */
function guessRegion(query: string): string {
  const known = ["Pulang Pisau", "Ketapang", "Ogan Komering Ilir", "Sebangau", "Kapuas", "Riau", "Barito Utara"];
  return known.find((r) => query.toLowerCase().includes(r.toLowerCase())) ?? "Kalimantan Tengah";
}

/**
 * Fetch live NASA FIRMS hotspots clustered & scored by the SIGAP backend.
 * Falls back to SAMPLE_HOTSPOTS only if the backend cannot be reached.
 */
export async function fetchMonitoringHotspots(
  region = "Kalimantan",
  limit = 15
): Promise<MonitoringHotspotsResponse> {
  try {
    const res = await fetch(
      `${API_URL}/api/hotspots/monitoring?region=${encodeURIComponent(region)}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as MonitoringHotspotsResponse;
    if (Array.isArray(data.hotspots) && data.hotspots.length > 0) {
      return data;
    }
    throw new Error("Empty hotspot list");
  } catch {
    return {
      is_live: false,
      source: "Local Fallback Cache",
      total_raw_hotspots: SAMPLE_HOTSPOTS.length,
      cluster_count: SAMPLE_HOTSPOTS.length,
      updated_at: new Date().toISOString(),
      hotspots: SAMPLE_HOTSPOTS,
    };
  }
}

/**
 * Start an autonomous investigation via `POST /api/investigations/`.
 * Falls back to a local stub when the backend is unreachable so the UI
 * stays usable during frontend-only development.
 */
export async function startInvestigation(query: string): Promise<Investigation> {
  try {
    const res = await fetch(`${API_URL}/api/investigations/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, region: guessRegion(query) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Investigation;
    return { ...data, region: data.region ?? guessRegion(query) };
  } catch {
    return {
      id: `local-${Date.now()}`,
      status: "running",
      query,
      region: guessRegion(query),
      created_at: new Date().toISOString(),
    };
  }
}

export interface ChatApiResponse {
  response: string;
  investigation_id: string;
  model_used?: string;
  is_live_llm?: boolean;
}

export async function sendChatMessage(
  message: string,
  investigationId?: string
): Promise<ChatApiResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        investigation_id: investigationId ?? null,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ChatApiResponse;
  } catch {
    return null;
  }
}

export interface RawHotspotPoint {
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time: string;
  confidence: string;
  frp: number;
  satellite: string;
  brightness?: number | null;
}

export interface SegmentationResponse {
  investigation_id: string;
  center: { lat: number; lon: number };
  model: string;
  burned_area_hectares: number;
  pixel_resolution_meters: number;
  fire_radius: {
    outer_yellow_radius_km: number;
    middle_orange_radius_km: number;
    inner_red_radius_km: number;
  };
  coverage_breakdown_ha: {
    red_high_severity_ha: number;
    orange_moderate_severity_ha: number;
    yellow_low_severity_ha: number;
    total_burned_area_ha: number;
  };
  metrics?: {
    test_iou?: number;
    test_f1?: number;
    test_precision?: number;
    test_recall?: number;
  };
  stac_scene?: {
    source?: string;
    scene_id?: string;
    cloud_cover?: number;
    date?: string;
  };
  geojson: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: Record<string, any>;
      geometry: {
        type: "Polygon";
        coordinates: number[][][];
      };
    }>;
  };
}

export interface SpatialContextResponse {
  is_live_osm: boolean;
  center: { lat: number; lon: number };
  district: string;
  soil: string;
  peatland: boolean;
  settlements: Array<{
    name: string;
    place_type: string;
    lat: number;
    lon: number;
    distance_km: number;
    population: string;
    buffer_m: number;
    source: string;
  }>;
  peatland_polygons: Array<{
    name: string;
    natural_type: string;
    coordinates: number[][][];
    source: string;
  }>;
}

export interface ImageryMetadataResponse {
  investigation_id: string;
  satellite: string;
  pre_fire: {
    scene_id?: string;
    date: string;
    gibs_date?: string;
    cloud_cover_percentage: number;
    bands: string[];
    rgb_tile_url: string;
    gibs_true_color_url?: string;
  };
  post_fire: {
    scene_id?: string;
    date: string;
    gibs_date?: string;
    cloud_cover_percentage: number;
    bands: string[];
    rgb_tile_url: string;
    false_color_tile_url?: string;
    stac_thumbnail_url?: string;
  };
}

export async function fetchRawHotspots(
  region = "Kalimantan",
  limit = 150
): Promise<RawHotspotPoint[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/hotspots/?region=${encodeURIComponent(region)}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as RawHotspotPoint[];
  } catch {
    return [];
  }
}

export async function fetchSegmentationData(
  lat: number,
  lon: number,
  scale = 1.0
): Promise<SegmentationResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/map/segmentation/live?lat=${lat}&lon=${lon}&scale=${scale}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SegmentationResponse;
  } catch {
    return null;
  }
}

export async function fetchSpatialContext(
  lat: number,
  lon: number
): Promise<SpatialContextResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/map/context?lat=${lat}&lon=${lon}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SpatialContextResponse;
  } catch {
    return null;
  }
}

export async function fetchImageryMetadata(
  postDate?: string,
  lat?: number,
  lon?: number
): Promise<ImageryMetadataResponse | null> {
  try {
    const params = new URLSearchParams();
    if (postDate) params.set("post_date", postDate);
    if (lat !== undefined) params.set("lat", String(lat));
    if (lon !== undefined) params.set("lon", String(lon));
    const q = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/api/map/imagery/live${q}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ImageryMetadataResponse;
  } catch {
    return null;
  }
}

export interface LiveReportItem {
  id: string;
  caseNumber: string;
  region: string;
  date: string;
  status: "Draft" | "Ditinjau" | "Selesai" | "Arsip";
  examiner: string;
  summary: string;
  totalBurnedAreaHa?: number;
  priorityScore?: number;
  exportFormats: ("pdf" | "geojson")[];
  lat?: number;
  lon?: number;
  hotspotCount?: number;
  totalFrp?: number;
  isLive?: boolean;
}

export interface LiveReportsResponse {
  is_live: boolean;
  updated_at?: string;
  total_cases: number;
  reports: LiveReportItem[];
}

export async function fetchReports(
  region = "Kalimantan",
  limit = 10
): Promise<LiveReportsResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/reports/?region=${encodeURIComponent(region)}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as LiveReportsResponse;
  } catch {
    return null;
  }
}

export function getReportDownloadUrl(
  caseNumber: string,
  lat?: number,
  lon?: number
): string {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set("lat", String(lat));
  if (lon !== undefined) params.set("lon", String(lon));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return `${API_URL}/api/reports/${encodeURIComponent(caseNumber)}/download${qs}`;
}

export async function fetchReportGeoJSON(
  caseNumber: string,
  lat?: number,
  lon?: number
): Promise<Record<string, unknown> | null> {
  try {
    const params = new URLSearchParams();
    if (lat !== undefined) params.set("lat", String(lat));
    if (lon !== undefined) params.set("lon", String(lon));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${API_URL}/api/reports/${encodeURIComponent(caseNumber)}/export${qs}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface GeocodedPlace {
  name: string;
  lat: number;
  lon: number;
  zoom: number;
  type?: string;
}

export async function searchGeocodePlaces(
  query: string,
  limit = 5
): Promise<GeocodedPlace[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `${API_URL}/api/map/geocode?q=${encodeURIComponent(query.trim())}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as GeocodedPlace[];
  } catch {
    return [];
  }
}

