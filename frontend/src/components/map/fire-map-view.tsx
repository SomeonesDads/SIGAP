"use client";

import React, { useState } from "react";
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
  Maximize2,
  Download,
  Info,
  ChevronRight,
} from "lucide-react";
import { MapContainer } from "@/components/map/map-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LayerOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  color: string;
}

export function FireMapView() {
  const [layers, setLayers] = useState<LayerOption[]>([
    {
      id: "hotspots",
      name: "Titik Panas (Hotspot)",
      description: "NASA FIRMS VIIRS 375m & MODIS 1km",
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
      name: "Lahan Gambut",
      description: "Peta hidrologis & kedalaman gambut (BBSDLP)",
      icon: <Trees className="h-4 w-4 text-emerald-700" />,
      active: false,
      color: "border-emerald-500/50 text-emerald-700",
    },
    {
      id: "settlement",
      name: "Permukiman & Buffer",
      description: "Zona penyangga keselamatan warga (1 - 5 km)",
      icon: <Home className="h-4 w-4 text-cyan-700" />,
      active: false,
      color: "border-cyan-500/50 text-cyan-700",
    },
  ]);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedRegion, setSelectedRegion] = useState("Pulang Pisau, Kalteng");

  const REGION_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
    "Pulang Pisau, Kalteng": { center: [-2.9812, 114.1205], zoom: 11 },
    "Ketapang, Kalbar": { center: [-1.8488, 109.9723], zoom: 11 },
    "OKI, Sumsel": { center: [-3.4116, 105.1092], zoom: 10 },
    "TN Sebangau, Kalteng": { center: [-2.5638, 113.8856], zoom: 10 },
  };

  const currentRegionConfig = REGION_COORDINATES[selectedRegion] || {
    center: [-2.9812, 114.1205],
    zoom: 10,
  };

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, active: !layer.active } : layer
      )
    );
  };

  const activeLayerNames = layers
    .filter((l) => l.active)
    .map((l) => l.name);

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-mono font-medium tracking-[-0.02em] text-black flex items-center gap-2">
            Fire Analysis Map
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Visualisasi multikomoditas spasial karhutla, komparasi temporal satelit, dan tumpang tindih risiko gambut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-600">Wilayah:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-amber-700 font-medium focus:outline-none"
            >
              <option value="Pulang Pisau, Kalteng">Pulang Pisau, Kalteng</option>
              <option value="Ketapang, Kalbar">Ketapang, Kalbar</option>
              <option value="OKI, Sumsel">Ogan Komering Ilir, Sumsel</option>
              <option value="TN Sebangau, Kalteng">TN Sebangau, Kalteng</option>
            </select>
          </div>

          <Button variant="secondary" size="sm" className="text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor GeoTIFF/SHP</span>
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

            {/* DINOv3 Red/Orange/Yellow Radius & Severity Legend */}
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">
                  Cakupan Radius DINOv3 & Keparahan
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  vit_large_patch16
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-800 font-medium">Merah (Inti Tinggi)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">R: 0.70 km | Prob &ge; 0.80</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-800 font-medium">Oranye (Rambat Sedang)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">R: 1.25 km | Prob 0.60–0.80</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="text-slate-800 font-medium">Kuning (Sebaran Luar)</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[10px]">R: 1.85 km | Prob 0.40–0.60</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Tidak Terbakar</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">Prob &lt; 0.40 | dNBR &lt; 0.27</span>
                </div>
              </div>
            </div>
          </Card>
        </div>


        {/* Full-width Map Container & Before/After Comparison Slider (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <MapContainer
            center={currentRegionConfig.center}
            zoom={currentRegionConfig.zoom}
            height="h-[460px]"
            title={`Analisis Spasial: ${selectedRegion}`}
            activeLayers={activeLayerNames}
          />

          {/* Before/After Satellite Comparison Slider Placeholder */}
          <Card className="p-4 border-slate-200 bg-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Komparasi Satelit Sebelum & Sesudah (Before / After Slider)
                </h3>
              </div>
              <span className="text-xs text-slate-600 font-mono">
                Sensor: Landsat 8 OLI / TIRS
              </span>
            </div>

            {/* Visual Slider Simulator */}
            <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex select-none">
              {/* Left Side: Before Image Simulator */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-100/80 to-white flex flex-col justify-between p-4"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold w-fit">
                  <Calendar className="h-3 w-3" />
                  <span>SEBELUM: 02 Okt 2026</span>
                </div>
                <div className="text-xs text-emerald-800/90 font-medium bg-white/80 p-2 rounded backdrop-blur-sm max-w-xs">
                  Vegetasi hijau normal, tutupan kanopi utuh, NBR index baseline: 0.54
                </div>
              </div>

              {/* Right Side: After Image Simulator */}
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-100/80 to-amber-100/60 flex flex-col justify-between p-4 items-end text-right"
                style={{ width: `${100 - sliderPosition}%` }}
              >
                <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-700 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-semibold w-fit">
                  <Calendar className="h-3 w-3" />
                  <span>SESUDAH: 20 Okt 2026</span>
                </div>
                <div className="text-xs text-rose-800/90 font-medium bg-white/80 p-2 rounded backdrop-blur-sm max-w-xs">
                  Burn scar hitam pekat terdeteksi U-Net, dNBR melonjak ke 0.72 (High Severity)
                </div>
              </div>

              {/* Slider Handle Divider Line */}
              <div
                className="absolute inset-y-0 z-20 w-1 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] pointer-events-none"
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
