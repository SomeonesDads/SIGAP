"use client";

import React, { useEffect, useRef, useState } from "react";
import { Compass, Flame, Layers, Loader2, MapPin, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  activeLayers?: string[];
  interactive?: boolean;
  title?: string;
}

export function MapContainer({
  center = [-2.9812, 114.1205],
  zoom = 10,
  className,
  height = "h-[450px]",
  activeLayers = ["Titik Panas (Hotspot)", "Segmentasi U-Net", "dNBR (Burn Severity)"],
  interactive = true,
  title,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>({});
  const tileLayerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [basemap, setBasemap] = useState<"satellite" | "roadmap" | "terrain">("satellite");

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

  // Mark client hydration complete
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        // Clean up previous instance if exists on the container
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        if (!mapContainerRef.current || !isMounted) return;

        // Initialize Map
        const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false,
          attributionControl: false,
        });

        mapInstanceRef.current = map;

        // Add initial tile layer
        const initialCfg = BASEMAP_TILES[basemap];
        const tileLayer = L.tileLayer(initialCfg.url, {
          maxZoom: initialCfg.maxZoom,
          subdomains: initialCfg.subdomains as any,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        // Add Google Maps attribution in bottom left
        L.control
          .attribution({ position: "bottomleft", prefix: "© Google Maps | SIGAP" })
          .addTo(map);

        // Initialize Layer Groups
        const groups: Record<string, any> = {
          hotspots: L.layerGroup(),
          segmentation: L.layerGroup(),
          dnbr: L.layerGroup(),
          peatland: L.layerGroup(),
          settlement: L.layerGroup(),
        };

        layersGroupRef.current = groups;

        // --- LAYER 1: HOTSPOTS (FIRMS) ---
        const sampleHotspots = [
          { lat: center[0] + 0.015, lon: center[1] - 0.01, frp: 52.4, conf: "Tinggi (94%)", sat: "VIIRS SNPP" },
          { lat: center[0] - 0.02, lon: center[1] + 0.025, frp: 38.1, conf: "Tinggi (89%)", sat: "VIIRS NOAA-20" },
          { lat: center[0] + 0.005, lon: center[1] + 0.015, frp: 74.2, conf: "Kritis (98%)", sat: "MODIS Terra" },
          { lat: center[0] - 0.012, lon: center[1] - 0.018, frp: 21.6, conf: "Nominal (72%)", sat: "VIIRS SNPP" },
          { lat: center[0] + 0.028, lon: center[1] + 0.035, frp: 65.0, conf: "Tinggi (91%)", sat: "VIIRS NOAA-21" },
        ];

        sampleHotspots.forEach((hs, idx) => {
          const marker = L.circleMarker([hs.lat, hs.lon], {
            radius: Math.min(12, Math.max(6, hs.frp / 7)),
            fillColor: hs.frp > 50 ? "#ef4444" : "#f59e0b",
            color: "#ffffff",
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.85,
          });

          marker.bindPopup(`
            <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
              <div style="font-weight: 700; color: #b91c1c; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                🔥 Hotspot #${idx + 1}
              </div>
              <div><b>Radiasi Termal (FRP):</b> ${hs.frp} MW</div>
              <div><b>Tingkat Keyakinan:</b> ${hs.conf}</div>
              <div><b>Sensor Satelit:</b> ${hs.sat}</div>
              <div><b>Koordinat:</b> ${hs.lat.toFixed(4)}, ${hs.lon.toFixed(4)}</div>
            </div>
          `);

          marker.addTo(groups.hotspots);
        });

        // --- LAYER 2 & 3: DINOV3 BURNSEG 3-TIER COVERAGE (RED / ORANGE / YELLOW RADIUS) ---
        // 1. Outer Yellow Zone — Low Severity / Outer Spread Radius (prob: 0.40 - 0.60, dNBR < 0.27, R ~ 1.85 km)
        const yellowZoneCoords: [number, number][] = [
          [center[0] + 0.022, center[1] - 0.018],
          [center[0] + 0.030, center[1] + 0.008],
          [center[0] + 0.018, center[1] + 0.032],
          [center[0] - 0.008, center[1] + 0.035],
          [center[0] - 0.026, center[1] + 0.014],
          [center[0] - 0.024, center[1] - 0.016],
          [center[0] - 0.004, center[1] - 0.028],
        ];

        const yellowPolygon = L.polygon(yellowZoneCoords, {
          color: "#eab308",
          weight: 2,
          fillColor: "#facc15",
          fillOpacity: 0.28,
          dashArray: "5, 5",
        });

        yellowPolygon.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #a16207; margin-bottom: 4px;">
              🟨 Zona Kuning — Keparahan Rendah (Outer Radius)
            </div>
            <div><b>Model:</b> DINOv3 BurnSeg (vit_large_patch16_dinov3.sat493m)</div>
            <div><b>Radius Sebaran Luar:</b> 1.85 km (1,850 m)</div>
            <div><b>Luas Cakupan Kuning:</b> 70.1 Hektare</div>
            <div><b>Threshold:</b> Prob 0.40–0.60 | dNBR &lt; 0.27</div>
            <div><b>Status:</b> Zona Penyangga / Peringatan Dini</div>
          </div>
        `);
        yellowPolygon.addTo(groups.segmentation);

        // 2. Middle Orange Zone — Moderate Severity / Active Fire Spread (prob: 0.60 - 0.80, dNBR 0.27-0.44, R ~ 1.25 km)
        const orangeZoneCoords: [number, number][] = [
          [center[0] + 0.015, center[1] - 0.012],
          [center[0] + 0.021, center[1] + 0.006],
          [center[0] + 0.012, center[1] + 0.022],
          [center[0] - 0.006, center[1] + 0.023],
          [center[0] - 0.017, center[1] + 0.009],
          [center[0] - 0.015, center[1] - 0.011],
          [center[0] - 0.002, center[1] - 0.019],
        ];

        const orangePolygon = L.polygon(orangeZoneCoords, {
          color: "#ea580c",
          weight: 2,
          fillColor: "#f97316",
          fillOpacity: 0.42,
        });

        orangePolygon.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #c2410c; margin-bottom: 4px;">
              🟧 Zona Oranye — Keparahan Sedang (Active Spread)
            </div>
            <div><b>Model:</b> DINOv3 BurnSeg (vit_large_patch16_dinov3.sat493m)</div>
            <div><b>Radius Rambat Aktif:</b> 1.25 km (1,250 m)</div>
            <div><b>Luas Cakupan Oranye:</b> 52.8 Hektare</div>
            <div><b>Threshold:</b> Prob 0.60–0.80 | dNBR 0.27–0.44</div>
            <div><b>Status:</b> Penyekatan Jalur Api Prioritas</div>
          </div>
        `);
        orangePolygon.addTo(groups.segmentation);
        orangePolygon.addTo(groups.dnbr);

        // 3. Inner Red Zone — High Severity / Core Burn Epicenter (prob >= 0.80, dNBR >= 0.44, R ~ 0.70 km)
        const redZoneCoords: [number, number][] = [
          [center[0] + 0.009, center[1] - 0.006],
          [center[0] + 0.013, center[1] + 0.004],
          [center[0] + 0.006, center[1] + 0.013],
          [center[0] - 0.004, center[1] + 0.012],
          [center[0] - 0.009, center[1] + 0.003],
          [center[0] - 0.007, center[1] - 0.006],
        ];

        const redPolygon = L.polygon(redZoneCoords, {
          color: "#dc2626",
          weight: 2.5,
          fillColor: "#ef4444",
          fillOpacity: 0.60,
        });

        redPolygon.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #b91c1c; margin-bottom: 4px;">
              🟥 Zona Merah — Keparahan Tinggi (Inti Episentrum)
            </div>
            <div><b>Model:</b> DINOv3 BurnSeg (vit_large_patch16_dinov3.sat493m)</div>
            <div><b>Radius Inti Api:</b> 0.70 km (700 m)</div>
            <div><b>Luas Cakupan Merah:</b> 34.4 Hektare</div>
            <div><b>Threshold:</b> Prob &ge; 0.80 | dNBR &ge; 0.44</div>
            <div><b>Test Precision / F1:</b> 77.3% / 0.665</div>
            <div><b>Status:</b> Intervensi Pemadaman Segera (KRITIS)</div>
          </div>
        `);
        redPolygon.addTo(groups.segmentation);
        redPolygon.addTo(groups.dnbr);


        // --- LAYER 4: LAHAN GAMBUT (PEATLAND) ---
        const peatlandCoords: [number, number][] = [
          [center[0] + 0.05, center[1] - 0.06],
          [center[0] + 0.06, center[1] + 0.06],
          [center[0] - 0.06, center[1] + 0.06],
          [center[0] - 0.05, center[1] - 0.06],
        ];

        const peatPolygon = L.polygon(peatlandCoords, {
          color: "#10b981",
          weight: 2,
          fillColor: "#059669",
          fillOpacity: 0.15,
          dashArray: "6, 6",
        });

        peatPolygon.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #047857; margin-bottom: 4px;">
              🌲 Batas Lahan Gambut (BBSDLP)
            </div>
            <div><b>Kedalaman Gambut:</b> Gambut Sangat Dalam (&gt; 3 meter)</div>
            <div><b>Faktor Risiko:</b> Potensi kebakaran bawah permukaan (smoldering)</div>
          </div>
        `);
        peatPolygon.addTo(groups.peatland);

        // --- LAYER 5: PERMUKIMAN & BUFFER ---
        const settlementPoint: [number, number] = [center[0] - 0.035, center[1] - 0.025];
        const settlementMarker = L.circleMarker(settlementPoint, {
          radius: 8,
          fillColor: "#06b6d4",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.9,
        });

        const settlementBuffer = L.circle(settlementPoint, {
          radius: 2000, // 2 km buffer
          color: "#0891b2",
          weight: 1.5,
          fillColor: "#22d3ee",
          fillOpacity: 0.12,
        });

        settlementMarker.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #0e7490; margin-bottom: 4px;">
              🏘️ Permukiman Warga (Buffer 2.0 km)
            </div>
            <div><b>Estimasi Populasi:</b> 1,450 Jiwa</div>
            <div><b>Jarak ke Titik Api:</b> 800 meter</div>
            <div><b>Status:</b> Siaga Evakuasi</div>
          </div>
        `);

        settlementMarker.addTo(groups.settlement);
        settlementBuffer.addTo(groups.settlement);

        // Attach default active layers
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
  }, [isClient, center[0], center[1], zoom]);

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
