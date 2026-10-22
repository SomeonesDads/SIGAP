"use client";

import React, { useEffect, useRef, useState } from "react";
import { Compass, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDinov3CoverageRings, rawPointToHotspot, type Hotspot } from "@/lib/monitoring";
import type {
  RawHotspotPoint,
  SegmentationResponse,
  SpatialContextResponse,
} from "@/lib/api";

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  activeLayers?: string[];
  interactive?: boolean;
  title?: string;
  hotspots?: RawHotspotPoint[];
  clusters?: Hotspot[];
  segmentation?: SegmentationResponse | null;
  spatialContext?: SpatialContextResponse | null;
}

export function MapContainer({
  center = [-2.2, 118.0],
  zoom = 5,
  className,
  height = "h-[450px]",
  activeLayers = ["Titik Panas (Hotspot)", "Segmentasi DINOv3 BurnSeg", "dNBR (Burn Severity)"],
  interactive = true,
  title,
  hotspots = [],
  clusters = [],
  segmentation = null,
  spatialContext = null,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>({});
  const tileLayerRef = useRef<any>(null);
  const prevViewRef = useRef<{ lat: number; lon: number; zoom: number }>({
    lat: center[0],
    lon: center[1],
    zoom,
  });
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [basemap, setBasemap] = useState<"satellite" | "roadmap" | "terrain">("satellite");
  const [selectedRawHotspot, setSelectedRawHotspot] = useState<Hotspot | null>(null);

  const BASEMAP_TILES = {
    satellite: {
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "© Google Maps (Satellite Hybrid)",
    },
    roadmap: {
      url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "© Google Maps (Roadmap)",
    },
    terrain: {
      url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "© Google Maps (Terrain)",
    },
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Leaflet Map instance once
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        if (!mapContainerRef.current || !isMounted) return;

        const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          minZoom: 4,
          zoomControl: false,
          attributionControl: false,
        });

        mapInstanceRef.current = map;
        map.on("zoomend", () => {
          if (isMounted) setMapZoom(map.getZoom());
        });

        const initialCfg = BASEMAP_TILES[basemap];
        const tileLayer = L.tileLayer(initialCfg.url, {
          maxZoom: initialCfg.maxZoom,
          subdomains: initialCfg.subdomains as any,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        L.control
          .attribution({ position: "bottomleft", prefix: "© Google Maps | NASA FIRMS | OSM | SIGAP" })
          .addTo(map);

        const groups: Record<string, any> = {
          segmentation: L.layerGroup(),
          dnbr: L.layerGroup(),
          peatland: L.layerGroup(),
          settlement: L.layerGroup(),
          hotspots: L.layerGroup(),
        };

        layersGroupRef.current = groups;

        // Attach active layer groups
        Object.entries(groups).forEach(([key, group]) => {
          const isMatching = activeLayers.some((al) => {
            const lower = al.toLowerCase();
            if (key === "hotspots" && (lower.includes("hotspot") || lower.includes("titik panas"))) return true;
            if (key === "segmentation" && (lower.includes("segmentasi") || lower.includes("u-net") || lower.includes("dinov3"))) return true;
            if (key === "dnbr" && lower.includes("dnbr")) return true;
            if (key === "peatland" && (lower.includes("gambut") || lower.includes("peatland"))) return true;
            if (key === "settlement" && (lower.includes("permukiman") || lower.includes("settlement") || lower.includes("buffer"))) return true;
            return false;
          });

          if (isMatching) {
            group.addTo(map);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Leaflet map:", err);
        setIsLoading(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Fly to new center/zoom ONLY when the user explicitly selects a different region
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const prev = prevViewRef.current;
    if (
      Math.abs(prev.lat - center[0]) > 0.0001 ||
      Math.abs(prev.lon - center[1]) > 0.0001 ||
      prev.zoom !== zoom
    ) {
      prevViewRef.current = { lat: center[0], lon: center[1], zoom };
      mapInstanceRef.current.flyTo(center, zoom, { duration: 0.9 });
      setMapZoom(zoom);
    }
  }, [center[0], center[1], zoom]);

  // Populate & update spatial layers dynamically when live data or zoom changes
  useEffect(() => {
    if (!isClient || !mapInstanceRef.current || !layersGroupRef.current) return;

    async function renderLiveLayers() {
      const L = (await import("leaflet")).default;
      const groups = layersGroupRef.current;
      if (!groups || !groups.hotspots) return;

      groups.hotspots.clearLayers();
      groups.segmentation.clearLayers();
      groups.dnbr.clearLayers();
      groups.peatland.clearLayers();
      groups.settlement.clearLayers();

      // 1. DINOV3 MULTI-RING COVERED AREA OVERLAYS ACROSS ALL ACTIVE INDONESIA CLUSTERS + ANY CLICKED SMALL FIRE
      // (Rendered outermost Yellowish -> Amber-Orange -> Red-Orange -> Deep Red core)
      const clustersWithSelected =
        selectedRawHotspot && !clusters.some((c) => c.id === selectedRawHotspot.id)
          ? [...clusters, selectedRawHotspot]
          : clusters;

      clustersWithSelected.forEach((c, idx) => {
        const rings = buildDinov3CoverageRings(c, mapZoom);
        rings.forEach((ring) => {
          const poly = L.polygon(ring.positions, {
            color: ring.strokeColor,
            weight: ring.weight,
            fillColor: ring.fillColor,
            fillOpacity: ring.fillOpacity,
            dashArray: ring.dashArray,
          });
          const badge =
            ring.tier === "CORE_DEEPRED"
              ? "🟥"
              : ring.tier === "INNER_ORANGE"
              ? "🟧"
              : ring.tier === "MID_AMBER"
              ? "🟠"
              : "🟨";
          poly.bindPopup(`
            <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
              <div style="font-weight: 700; color: ${ring.strokeColor}; margin-bottom: 4px;">
                ${badge} ${ring.label}
              </div>
              <div><b>Klaster:</b> ${c.id} — ${c.location}</div>
              <div><b>Wilayah:</b> ${c.district ?? "Indonesia"}</div>
              <div><b>Radius Fisik Zona:</b> ${ring.radiusKm} km</div>
              <div><b>Estimasi Luas Terbakar:</b> ${c.areaHa} Ha (dNBR ${c.dnbrMean})</div>
              <div><b>Titik Panas Klaster:</b> ${c.hotspotCount ?? 1} titik (FRP ${c.totalFrp ?? 25} MW)</div>
            </div>
          `);
          poly.addTo(groups.segmentation);
          if (ring.tier === "CORE_DEEPRED" || ring.tier === "INNER_ORANGE") {
            const dnbrClone = L.polygon(ring.positions, {
              color: ring.strokeColor,
              weight: ring.weight,
              fillColor: ring.fillColor,
              fillOpacity: ring.fillOpacity,
            });
            dnbrClone.bindPopup(poly.getPopup()!);
            dnbrClone.addTo(groups.dnbr);
          }

          // When zoomed in (mapZoom >= 8), automatically show all 4 zone output popups for the focused cluster
          const isPrimaryCluster = selectedRawHotspot ? c.id === selectedRawHotspot.id : idx === 0;
          if (mapZoom >= 8 && isPrimaryCluster) {
            const baseAreaHa = Math.max(12, c.areaHa ?? 120);
            const isPeat = Boolean(c.peatland) || (c.soil ?? "").toLowerCase().includes("gambut");
            const projected24hHa = Math.round(baseAreaHa * (isPeat ? 1.85 : 2.15));
            const totalLoss24hMiliar = ((projected24hHa * (isPeat ? 59.5 : 31.5)) / 1000).toFixed(2);
            const vIdx =
              ring.tier === "CORE_DEEPRED"
                ? 15
                : ring.tier === "INNER_ORANGE"
                ? 9
                : ring.tier === "MID_AMBER"
                ? 21
                : 3;
            const pos = ring.positions[vIdx] ?? ring.positions[0];
            const tierTag =
              ring.tier === "CORE_DEEPRED"
                ? "ZONA 1 • INTI"
                : ring.tier === "INNER_ORANGE"
                ? "ZONA 2 • AKTIF"
                : ring.tier === "MID_AMBER"
                ? "ZONA 3 • TRANSISI"
                : "ZONA 4 • BUFFER 24J";
            const summaryLine =
              ring.tier === "CORE_DEEPRED"
                ? `Inti: ${(baseAreaHa * 0.24).toFixed(1)} Ha • Drop Udara UDP-1`
                : ring.tier === "INNER_ORANGE"
                ? `Aktif: ${(baseAreaHa * 0.31).toFixed(1)} Ha • Sayap POS-2/3`
                : ring.tier === "MID_AMBER"
                ? `Angin ${ring.windSpeedKmh} km/j → ${ring.windDirectionLabel}`
                : `Proyeksi 24j: ${projected24hHa} Ha • Rp ${totalLoss24hMiliar} M`;

            const calloutIcon = L.divIcon({
              className: "sigap-zone-auto-popup",
              iconSize: [188, 1],
              iconAnchor: [94, 12],
              html: `<div style="width:188px;background:rgba(15,23,42,0.92);border:1.5px solid ${ring.strokeColor};border-radius:7px;padding:4px 6px;color:#f8fafc;font:500 9.5px system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,0.35)"><div style="font-weight:700;color:#fde047;font-size:9px">${badge} ${tierTag} (${ring.radiusKm} km)</div><div>${summaryLine}</div></div>`,
            });
            L.marker(pos, { icon: calloutIcon, zIndexOffset: 1200 }).addTo(groups.segmentation);
          }
        });
      });

      // 2. DETAILED DINOV3 BURNSEG GEOJSON POLYGONS FROM BACKEND INFERENCE
      if (segmentation?.geojson?.features) {
        segmentation.geojson.features.forEach((feat) => {
          const props = feat.properties || {};
          const tier = String(props.severity_tier || "LOW").toUpperCase();
          const coordsRing = feat.geometry?.coordinates?.[0] || [];
          const latLngs: [number, number][] = coordsRing.map((pt: number[]) => [pt[1], pt[0]]);
          if (latLngs.length < 3) return;

          const style =
            tier === "HIGH"
              ? { color: "#7f1d1d", weight: 2.2, fillColor: "#991b1b", fillOpacity: 0.72 }
              : tier === "MODERATE"
              ? { color: "#dc2626", weight: 1.8, fillColor: "#ef4444", fillOpacity: 0.52 }
              : tier === "MODERATE_LOW"
              ? { color: "#f97316", weight: 1.5, fillColor: "#fb923c", fillOpacity: 0.38 }
              : { color: "#eab308", weight: 1.4, fillColor: "#fde047", fillOpacity: 0.28, dashArray: "5, 5" };

          const poly = L.polygon(latLngs, style);
          const badge = tier === "HIGH" ? "🟥" : tier === "MODERATE" ? "🟧" : tier === "MODERATE_LOW" ? "🟠" : "🟨";

          poly.bindPopup(`
            <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
              <div style="font-weight: 700; color: ${style.color}; margin-bottom: 4px;">
                ${badge} ${props.label || tier}
              </div>
              <div><b>Model:</b> ${segmentation.model}</div>
              <div><b>Radius Cakupan:</b> ${props.radius_km} km (${props.radius_m} m)</div>
              <div><b>Luas Terdampak:</b> ${props.area_ha} Hektare</div>
              <div><b>Threshold:</b> Prob ${props.prob_range} | dNBR ${props.dnbr_threshold}</div>
              <div><b>Keyakinan Rata-rata:</b> ${Math.round(Number(props.mean_confidence || 0.85) * 100)}%</div>
            </div>
          `);

          poly.addTo(groups.segmentation);
          if (tier === "HIGH" || tier === "MODERATE") {
            const dnbrClone = L.polygon(latLngs, style);
            dnbrClone.bindPopup(poly.getPopup()!);
            dnbrClone.addTo(groups.dnbr);
          }
        });
      }

      // 3. LIVE FIRMS HOTSPOTS & CLUSTERS LAYER (rendered with fire logo icons on top of DINOv3 coverage polygons)
      clusters.forEach((c) => {
        const iconSrc =
          c.severity === "tinggi"
            ? "/figma/fire-high.svg"
            : c.severity === "sedang"
            ? "/figma/fire-medium.svg"
            : "/figma/fire-low.svg";
        const cIcon = L.divIcon({
          className: "sigap-marker",
          iconSize: [16, 20],
          iconAnchor: [8, 10],
          html: `<img src="${iconSrc}" width="16" height="20" alt="" style="display:block;max-width:none;cursor:pointer"/>`,
        });
        const cMarker = L.marker([c.lat, c.lon], { icon: cIcon });
        cMarker.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #b91c1c; margin-bottom: 4px;">
              🔥 ${c.id} — ${c.location}
            </div>
            <div><b>Wilayah:</b> ${c.district ?? "Indonesia"}</div>
            <div><b>Keparahan:</b> ${c.severity.toUpperCase()} (Skor MCDA ${c.riskScore})</div>
            <div><b>Titik Panas Klaster:</b> ${c.hotspotCount ?? 1} titik (FRP ${c.totalFrp ?? 25} MW)</div>
          </div>
        `);
        cMarker.addTo(groups.hotspots);
      });

      hotspots.forEach((hs, idx) => {
        const frp = Number(hs.frp ?? 15.0);
        const conf = String(hs.confidence ?? "").toLowerCase();
        const iconSrc =
          frp >= 28 || conf === "high" || conf === "h"
            ? "/figma/fire-high.svg"
            : frp >= 12 || conf === "nominal" || conf === "n"
            ? "/figma/fire-medium.svg"
            : "/figma/fire-low.svg";
        const fIcon = L.divIcon({
          className: "sigap-marker",
          iconSize: [12, 16],
          iconAnchor: [6, 8],
          html: `<img src="${iconSrc}" width="12" height="16" alt="" style="display:block;max-width:none;cursor:pointer;opacity:0.92"/>`,
        });
        const marker = L.marker([hs.latitude, hs.longitude], { icon: fIcon });

        const timeFormatted = hs.acq_time && hs.acq_time.length >= 4
          ? `${hs.acq_time.slice(0, 2)}:${hs.acq_time.slice(2, 4)} UTC`
          : hs.acq_time;

        marker.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #b91c1c; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              🔥 Live FIRMS Hotspot #${idx + 1}
            </div>
            <div><b>Radiasi Termal (FRP):</b> ${frp.toFixed(1)} MW</div>
            <div><b>Keyakinan:</b> ${hs.confidence.toUpperCase()}</div>
            <div><b>Waktu Akuisisi:</b> ${hs.acq_date} ${timeFormatted}</div>
            <div><b>Sensor Satelit:</b> ${hs.satellite}</div>
            ${hs.brightness ? `<div><b>Suhu Kecerahan:</b> ${hs.brightness.toFixed(1)} K</div>` : ""}
            <div><b>Koordinat:</b> ${hs.latitude.toFixed(4)}°, ${hs.longitude.toFixed(4)}°</div>
          </div>
        `);

        marker.on("click", () => {
          setSelectedRawHotspot(rawPointToHotspot(hs, idx, clusters));
        });

        marker.addTo(groups.hotspots);
      });

      // 3. LIVE PEATLAND / WETLAND POLYGONS (OSM Overpass / KHG)
      if (spatialContext?.peatland_polygons) {
        spatialContext.peatland_polygons.forEach((peat) => {
          const ring = peat.coordinates?.[0] || [];
          const latLngs: [number, number][] = ring.map((pt: number[]) => [pt[1], pt[0]]);
          if (latLngs.length < 3) return;

          const peatPoly = L.polygon(latLngs, {
            color: "#10b981",
            weight: 2,
            fillColor: "#059669",
            fillOpacity: 0.16,
            dashArray: "6, 6",
          });

          peatPoly.bindPopup(`
            <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
              <div style="font-weight: 700; color: #047857; margin-bottom: 4px;">
                🌲 ${peat.name}
              </div>
              <div><b>Karakteristik Tanah:</b> ${peat.natural_type}</div>
              <div><b>Wilayah:</b> ${spatialContext.district}</div>
              <div><b>Sumber Data:</b> ${peat.source}</div>
            </div>
          `);
          peatPoly.addTo(groups.peatland);
        });
      }

      // 4. LIVE SETTLEMENTS & SAFETY BUFFERS (OpenStreetMap Overpass)
      if (spatialContext?.settlements) {
        spatialContext.settlements.forEach((st) => {
          const sPoint: [number, number] = [st.lat, st.lon];
          const sMarker = L.circleMarker(sPoint, {
            radius: 7.5,
            fillColor: "#06b6d4",
            color: "#ffffff",
            weight: 2,
            fillOpacity: 0.92,
          });

          const sBuffer = L.circle(sPoint, {
            radius: st.buffer_m || 2000,
            color: "#0891b2",
            weight: 1.5,
            fillColor: "#22d3ee",
            fillOpacity: 0.11,
          });

          const popupHtml = `
            <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
              <div style="font-weight: 700; color: #0e7490; margin-bottom: 4px;">
                🏘️ ${st.name} (${st.place_type})
              </div>
              <div><b>Jarak ke Episentrum Api:</b> ${st.distance_km} km</div>
              <div><b>Radius Penyangga:</b> ${(st.buffer_m / 1000).toFixed(1)} km</div>
              <div><b>Estimasi Populasi:</b> ${st.population}</div>
              <div><b>Sumber:</b> ${st.source}</div>
            </div>
          `;

          sMarker.bindPopup(popupHtml);
          sBuffer.bindPopup(popupHtml);
          sMarker.addTo(groups.settlement);
          sBuffer.addTo(groups.settlement);
        });
      }
    }

    renderLiveLayers();
  }, [isClient, hotspots, clusters, segmentation, spatialContext, mapZoom, selectedRawHotspot]);

  // Handle Layer Toggle dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const map = mapInstanceRef.current;
    const groups = layersGroupRef.current;

    Object.entries(groups).forEach(([key, group]: [string, any]) => {
      const shouldBeActive = activeLayers.some((al) => {
        const lower = al.toLowerCase();
        if (key === "hotspots" && (lower.includes("hotspot") || lower.includes("titik panas"))) return true;
        if (key === "segmentation" && (lower.includes("segmentasi") || lower.includes("u-net") || lower.includes("dinov3"))) return true;
        if (key === "dnbr" && lower.includes("dnbr")) return true;
        if (key === "peatland" && (lower.includes("gambut") || lower.includes("peatland"))) return true;
        if (key === "settlement" && (lower.includes("permukiman") || lower.includes("settlement") || lower.includes("buffer"))) return true;
        return false;
      });


      if (shouldBeActive) {
        if (!map.hasLayer(group)) {
          map.addLayer(group);
        }
      } else {
        if (map.hasLayer(group)) {
          map.removeLayer(group);
        }
      }
    });
  }, [activeLayers]);

  // Handle Basemap Swap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    async function swapBasemap() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      const cfg = BASEMAP_TILES[basemap];

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const newTileLayer = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains as any,
      });

      newTileLayer.addTo(map);
      newTileLayer.bringToBack();
      tileLayerRef.current = newTileLayer;
    }

    swapBasemap();
  }, [basemap]);

  // Zoom helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner",
        height,
        className
      )}
    >
      {/* Real Interactive Leaflet Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100 backdrop-blur-sm text-slate-700">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
          <span className="text-xs font-medium">Memuat Peta Spasial...</span>
        </div>
      )}

      {/* Top Map Header / Controls Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-white border border-slate-300/80 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md text-slate-800 shadow-lg">
        <Compass className="h-4 w-4 text-amber-700" />
        <span className="font-semibold">{title || "Peta Analisis Spasial Karhutla"}</span>
        <span className="text-slate-600 border-l border-slate-300 pl-2">
          {center[0].toFixed(4)}°, {center[1].toFixed(4)}°
        </span>
      </div>

      {/* Layer badges on top right */}
      {activeLayers.length > 0 && (
        <div className="absolute top-3 right-3 z-[400] hidden sm:flex items-center gap-1.5 flex-wrap max-w-sm justify-end">
          {activeLayers.slice(0, 3).map((layer) => (
            <span
              key={layer}
              className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white border border-slate-300/80 text-amber-700 backdrop-blur-md flex items-center gap-1 shadow-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {layer}
            </span>
          ))}
          {activeLayers.length > 3 && (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white border border-slate-300/80 text-slate-700">
              +{activeLayers.length - 3} lagi
            </span>
          )}
        </div>
      )}

      {/* Bottom Left: Google Maps Basemap Switcher */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center bg-white border border-slate-300/80 rounded-lg p-0.5 shadow-xl backdrop-blur-md text-xs">
        <button
          type="button"
          onClick={() => setBasemap("satellite")}
          className={cn(
            "px-2.5 py-1 rounded-md font-medium transition-all text-[11px]",
            basemap === "satellite"
              ? "bg-sigap-cobalt text-white font-semibold shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          Google Satelit
        </button>
        <button
          type="button"
          onClick={() => setBasemap("roadmap")}
          className={cn(
            "px-2.5 py-1 rounded-md font-medium transition-all text-[11px]",
            basemap === "roadmap"
              ? "bg-sigap-cobalt text-white font-semibold shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          Google Peta
        </button>
        <button
          type="button"
          onClick={() => setBasemap("terrain")}
          className={cn(
            "px-2.5 py-1 rounded-md font-medium transition-all text-[11px]",
            basemap === "terrain"
              ? "bg-sigap-cobalt text-white font-semibold shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          Google Medan
        </button>
      </div>

      {/* Bottom Right: Zoom Controls */}
      {interactive && (
        <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1.5 bg-white border border-slate-300/80 p-1 rounded-lg backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
