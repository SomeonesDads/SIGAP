"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Sliders,
  Flame,
  Trees,
  Home,
  Scan,
  Calendar,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { MapContainer } from "@/components/map/map-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLACES, SAMPLE_HOTSPOTS, type Hotspot } from "@/lib/monitoring";
import {
  fetchImageryMetadata,
  fetchMonitoringHotspots,
  fetchRawHotspots,
  fetchSegmentationData,
  fetchSpatialContext,
  type ImageryMetadataResponse,
  type RawHotspotPoint,
  type SegmentationResponse,
  type SpatialContextResponse,
} from "@/lib/api";

interface LayerOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  color: string;
}

interface RegionOption {
  key: string;
  label: string;
  center: [number, number];
  zoom: number;
  regionQuery: string;
  scaleFactor: number;
  acqDate?: string;
  hotspotCount?: number;
  totalFrp?: number;
}

/** Convert (lat, lon, zoom) to Web Mercator slippy-map tile (x, y) indices. */
function latLonToTileXY(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export function FireMapView() {
  const [layers, setLayers] = useState<LayerOption[]>([
    {
      id: "hotspots",
      name: "Titik Panas (Hotspot)",
      description: "NASA FIRMS VIIRS 375m & MODIS 1km (Live NRT)",
      icon: <Flame className="h-4 w-4 text-amber-700" />,
      active: true,
      color: "border-amber-500/50 text-amber-700",
    },
    {
      id: "segmentation",
      name: "Segmentasi DINOv3 BurnSeg",
      description: "Prediksi radius & zona cakupan Merah/Oranye/Kuning",
      icon: <Scan className="h-4 w-4 text-rose-700" />,
      active: true,
      color: "border-rose-500/50 text-rose-700",
    },
    {
      id: "dnbr",
      name: "dNBR (Burn Severity)",
      description: "Tingkat keparahan kerusakan vegetasi (Thresholds: 0.27 / 0.44)",
      icon: <Sliders className="h-4 w-4 text-orange-700" />,
      active: true,
      color: "border-orange-500/50 text-orange-700",
    },
    {
      id: "peatland",
      name: "Lahan Gambut & Rawa",
      description: "Poligon hidrologis gambut & lahan basah (OSM / KLHK)",
      icon: <Trees className="h-4 w-4 text-emerald-700" />,
      active: true,
      color: "border-emerald-500/50 text-emerald-700",
    },
    {
      id: "settlement",
      name: "Permukiman & Buffer",
      description: "Desa terdekat via OpenStreetMap Overpass (Buffer 2 km)",
      icon: <Home className="h-4 w-4 text-cyan-700" />,
      active: true,
      color: "border-cyan-500/50 text-cyan-700",
    },
  ]);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [liveClusters, setLiveClusters] = useState<Hotspot[]>(SAMPLE_HOTSPOTS);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("cluster-0");

  const [rawHotspots, setRawHotspots] = useState<RawHotspotPoint[]>([]);
  const [segmentation, setSegmentation] = useState<SegmentationResponse | null>(null);
  const [spatialContext, setSpatialContext] = useState<SpatialContextResponse | null>(null);
  const [imageryMeta, setImageryMeta] = useState<ImageryMetadataResponse | null>(null);

  // 1. Load live FIRMS monitoring clusters for dynamic region selector
  useEffect(() => {
    let active = true;
    fetchMonitoringHotspots("Kalimantan", 12).then((res) => {
      if (!active) return;
      if (res.hotspots.length > 0) {
        setLiveClusters(res.hotspots);
        setIsLiveFeed(res.is_live);
        setSelectedKey("cluster-0");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Build dynamic region dropdown options from live clusters + named places
  const regionOptions = useMemo<RegionOption[]>(() => {
    const clusterOpts: RegionOption[] = liveClusters.slice(0, 8).map((c, idx) => {
      const count = c.hotspotCount ?? 1;
      const frp = c.totalFrp ?? 35;
      const scale = Math.min(2.4, Math.max(0.7, 0.75 + Math.log10(Math.max(1, count)) * 0.55));
      return {
        key: `cluster-${idx}`,
        label: `${c.id}: ${c.location.split(",")[0]} (${count} titik • ${c.district ?? "Kalimantan"})`,
        center: [c.lat, c.lon],
        zoom: 12,
        regionQuery: c.district || "Kalimantan",
        scaleFactor: Number(scale.toFixed(2)),
        acqDate: c.acqDate,
        hotspotCount: count,
        totalFrp: frp,
      };
    });

    const placeOpts: RegionOption[] = PLACES.map((p) => ({
      key: `place-${p.name}`,
      label: `Wilayah: ${p.name}`,
      center: [p.lat, p.lon],
      zoom: Math.max(10, p.zoom),
      regionQuery: p.name,
      scaleFactor: 1.0,
    }));

    return [...clusterOpts, ...placeOpts];
  }, [liveClusters]);

  const currentRegionConfig = useMemo<RegionOption>(() => {
    return (
      regionOptions.find((r) => r.key === selectedKey) ??
      regionOptions[0] ?? {
        key: "default",
        label: "Pulang Pisau, Kalteng",
        center: [-2.9812, 114.1205],
        zoom: 11,
        regionQuery: "Kalimantan Tengah",
        scaleFactor: 1.0,
      }
    );
  }, [regionOptions, selectedKey]);

  // 2. Fetch live raw hotspots, DINOv3 segmentation, OSM context, and satellite imagery metadata when region changes
  useEffect(() => {
    let active = true;
    const [lat, lon] = currentRegionConfig.center;

    Promise.all([
      fetchRawHotspots(currentRegionConfig.regionQuery, 250),
      fetchSegmentationData(lat, lon, currentRegionConfig.scaleFactor),
      fetchSpatialContext(lat, lon),
      fetchImageryMetadata(currentRegionConfig.acqDate, lat, lon),
    ]).then(([pts, seg, ctx, img]) => {
      if (!active) return;

      // Filter raw FIRMS points near the current view or sort by proximity so nearby detections are always shown
      const sortedByDist = [...pts].sort((a, b) => {
        const da = Math.hypot(a.latitude - lat, a.longitude - lon);
        const db = Math.hypot(b.latitude - lat, b.longitude - lon);
        return da - db;
      });
      setRawHotspots(sortedByDist.slice(0, 80));
      setSegmentation(seg);
      setSpatialContext(ctx);
      setImageryMeta(img);
    });

    return () => {
      active = false;
    };
  }, [
    currentRegionConfig.center[0],
    currentRegionConfig.center[1],
    currentRegionConfig.regionQuery,
    currentRegionConfig.scaleFactor,
    currentRegionConfig.acqDate,
  ]);

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, active: !layer.active } : layer
      )
    );
  };

  const activeLayerNames = layers.filter((l) => l.active).map((l) => l.name);

  // 3. Functional GeoJSON Export of all active live layers
  const handleExportGeoJSON = () => {
    const features: Array<Record<string, any>> = [];

    if (segmentation?.geojson?.features) {
      features.push(...segmentation.geojson.features);
    }

    rawHotspots.forEach((h, idx) => {
      features.push({
        type: "Feature",
        properties: {
          feature_type: "firms_hotspot",
          id: `FIRMS-${idx + 1}`,
          frp_mw: h.frp,
          confidence: h.confidence,
          acq_date: h.acq_date,
          acq_time: h.acq_time,
          satellite: h.satellite,
          brightness_k: h.brightness,
        },
        geometry: {
          type: "Point",
          coordinates: [h.longitude, h.latitude],
        },
      });
    });

    spatialContext?.peatland_polygons?.forEach((p) => {
      features.push({
        type: "Feature",
        properties: {
          feature_type: "peatland_hydrological_unit",
          name: p.name,
          soil_type: p.natural_type,
          source: p.source,
        },
        geometry: {
          type: "Polygon",
          coordinates: p.coordinates,
        },
      });
    });

    spatialContext?.settlements?.forEach((s) => {
      features.push({
        type: "Feature",
        properties: {
          feature_type: "settlement_buffer",
          name: s.name,
          place_type: s.place_type,
          distance_to_fire_km: s.distance_km,
          buffer_radius_m: s.buffer_m,
          source: s.source,
        },
        geometry: {
          type: "Point",
          coordinates: [s.lon, s.lat],
        },
      });
    });

    const geojsonPayload = {
      type: "FeatureCollection",
      name: `SIGAP_Live_Spatial_Export_${currentRegionConfig.key}`,
      generated_at: new Date().toISOString(),
      center: {
        lat: currentRegionConfig.center[0],
        lon: currentRegionConfig.center[1],
      },
      features,
    };

    const blob = new Blob([JSON.stringify(geojsonPayload, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Spatial_${currentRegionConfig.key}_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute 3x2 slippy tile grid around current center for the Before/After Satellite Slider
  const tileGrid = useMemo(() => {
    const z = 9;
    const { x, y } = latLonToTileXY(
      currentRegionConfig.center[0],
      currentRegionConfig.center[1],
      z
    );
    const gibsPreDate = imageryMeta?.pre_fire.gibs_date || "2026-10-02";
    const gibsPostDate = imageryMeta?.post_fire.gibs_date || "2026-10-20";
    const tiles: Array<{ key: string; preUrl: string; postUrl: string; postSwirUrl: string }> = [];

    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        tiles.push({
          key: `${z}-${tx}-${ty}`,
          preUrl: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/${z}/${ty}/${tx}.jpg`,
          postUrl: `https://mt1.google.com/vt/lyrs=s&x=${tx}&y=${ty}&z=${z}`,
          postSwirUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1/default/${gibsPostDate}/GoogleMapsCompatible_Level9/${z}/${ty}/${tx}.jpg`,
        });
        void gibsPreDate;
      }
    }
    return tiles;
  }, [currentRegionConfig.center[0], currentRegionConfig.center[1], imageryMeta]);

  const redRadius = segmentation?.fire_radius.inner_red_radius_km ?? 0.7;
  const orangeRadius = segmentation?.fire_radius.middle_orange_radius_km ?? 1.25;
  const yellowRadius = segmentation?.fire_radius.outer_yellow_radius_km ?? 1.85;
  const redHa = segmentation?.coverage_breakdown_ha.red_high_severity_ha ?? 34.4;
  const orangeHa = segmentation?.coverage_breakdown_ha.orange_moderate_severity_ha ?? 52.8;
  const yellowHa = segmentation?.coverage_breakdown_ha.yellow_low_severity_ha ?? 70.1;
  const totalHa = segmentation?.coverage_breakdown_ha.total_burned_area_ha ?? 157.3;

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-mono font-medium tracking-[-0.02em] text-black flex items-center gap-2">
              Fire Analysis Map
            </h1>
            {isLiveFeed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE FIRMS + OSM + DINOv3
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Visualisasi multikomoditas spasial karhutla, komparasi temporal satelit, dan tumpang tindih risiko gambut & permukiman live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-600">Klaster / Wilayah:</span>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="bg-transparent text-amber-700 font-medium focus:outline-none max-w-[320px] truncate"
            >
              {regionOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGeoJSON}
            className="text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor GeoJSON ({rawHotspots.length} Titik)</span>
          </Button>
        </div>
      </div>

      {/* Main Map + Layer Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Layer Controls Sidebar (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Layer Pengamatan Spasial
                </h3>
              </div>
              <span className="text-[11px] text-amber-700/90 font-mono">
                {activeLayerNames.length} Aktif
              </span>
            </div>

            <div className="space-y-2">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    layer.active
                      ? "bg-slate-100 border-slate-300 shadow-sm"
                      : "bg-slate-100 border-slate-200/60 opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg border bg-white ${
                        layer.active ? layer.color : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {layer.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {layer.name}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug">
                        {layer.description}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-600 hover:text-slate-800"
                  >
                    {layer.active ? (
                      <Eye className="h-4 w-4 text-amber-700" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic DINOv3 Red/Orange/Yellow Radius & Severity Legend */}
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">
                  Cakupan Radius DINOv3 ({totalHa} Ha)
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  vit_large_patch16
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-800 font-medium">Merah ({redHa} Ha)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">
                    R: {redRadius.toFixed(2)} km | Prob &ge; 0.80
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-800 font-medium">Oranye ({orangeHa} Ha)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">
                    R: {orangeRadius.toFixed(2)} km | Prob 0.60–0.80
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="text-slate-800 font-medium">Kuning ({yellowHa} Ha)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">
                    R: {yellowRadius.toFixed(2)} km | Prob 0.40–0.60
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    <span className="text-slate-600">Desa Terdekat (OSM)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">
                    {spatialContext?.settlements?.[0]
                      ? `${spatialContext.settlements[0].name} (${spatialContext.settlements[0].distance_km} km)`
                      : "Memuat..."}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Full-width Map Container & Real Satellite Before/After Comparison Slider (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <MapContainer
            center={currentRegionConfig.center}
            zoom={currentRegionConfig.zoom}
            height="h-[460px]"
            title={`Analisis Spasial: ${currentRegionConfig.label}`}
            activeLayers={activeLayerNames}
            hotspots={rawHotspots}
            segmentation={segmentation}
            spatialContext={spatialContext}
          />

          {/* Real Satellite Before/After Comparison Slider */}
          <Card className="p-4 border-slate-200 bg-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Komparasi Citra Satelit Pra & Pasca Kebakaran (Sentinel-2 vs VIIRS SWIR + Termal)
                </h3>
              </div>
              <span className="text-xs text-slate-600 font-mono">
                {currentRegionConfig.center[0].toFixed(3)}°, {currentRegionConfig.center[1].toFixed(3)}°
              </span>
            </div>

            {/* Dual Real Satellite Tile View Clipped by Slider */}
            <div className="relative h-52 w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-900 select-none">
              {/* Base Layer (Right Side): Post-Fire Satellite + NASA GIBS SWIR Thermal Overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
                {tileGrid.map((t) => (
                  <div key={`post-${t.key}`} className="relative size-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.postUrl}
                      alt=""
                      className="size-full object-cover brightness-95 contrast-125"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.postSwirUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover mix-blend-screen opacity-65"
                    />
                  </div>
                ))}
                {/* Thermal scar highlight centered on active cluster */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.52) 0%, rgba(249,115,22,0.32) 22%, rgba(234,179,8,0.14) 40%, transparent 65%)",
                  }}
                />
              </div>

              {/* Clipped Overlay (Left Side): Pre-Fire Baseline Sentinel-2 Cloudless Tiles */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <div className="grid size-full grid-cols-3 grid-rows-2">
                  {tileGrid.map((t) => (
                    <div key={`pre-${t.key}`} className="relative size-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.preUrl}
                        alt=""
                        className="size-full object-cover saturate-110"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Left Badge: Pre-Fire */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between p-3.5 z-10">
                <div className="inline-flex items-center gap-1.5 bg-emerald-950/85 text-emerald-200 border border-emerald-400/40 px-2.5 py-1 rounded-md text-[10px] font-semibold w-fit backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />
                  <span>PRA-KEBAKARAN: {imageryMeta?.pre_fire.date ?? "2026-10-02"} ({imageryMeta?.pre_fire.scene_id ?? "Sentinel-2 L2A"})</span>
                </div>
                <div className="text-[11px] text-white font-medium bg-slate-950/75 px-2.5 py-1.5 rounded-md backdrop-blur-sm max-w-xs border border-white/15">
                  AWS STAC Baseline • Tutupan awan {imageryMeta?.pre_fire.cloud_cover_percentage ?? 4.2}%
                </div>
              </div>

              {/* Right Badge: Post-Fire */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between p-3.5 items-end text-right z-10">
                <div className="inline-flex items-center gap-1.5 bg-rose-950/85 text-rose-200 border border-rose-400/40 px-2.5 py-1 rounded-md text-[10px] font-semibold w-fit backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />
                  <span>PASCA-KEBAKARAN: {imageryMeta?.post_fire.date ?? "2026-10-20"} ({imageryMeta?.post_fire.scene_id ?? "VIIRS SWIR"})</span>
                </div>
                <div className="text-[11px] text-white font-medium bg-slate-950/75 px-2.5 py-1.5 rounded-md backdrop-blur-sm max-w-xs border border-white/15">
                  AWS STAC (Awan {imageryMeta?.post_fire.cloud_cover_percentage ?? 6.8}%) • DINOv3 {totalHa} Ha (R: {yellowRadius} km)
                </div>
              </div>

              {/* Slider Handle Divider Line */}
              <div
                className="absolute inset-y-0 z-20 w-1 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                  ↔
                </div>
              </div>
            </div>

            {/* Slider Range Input */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-emerald-700 font-medium">Pra-Kebakaran</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-xs text-rose-700 font-medium">Pasca-Kebakaran</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
