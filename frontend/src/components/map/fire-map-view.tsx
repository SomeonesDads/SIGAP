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
      icon: <Flame className="h-4 w-4 text-amber-400" />,
      active: true,
      color: "border-amber-500/50 text-amber-400",
    },
    {
      id: "segmentation",
      name: "Segmentasi U-Net",
      description: "Prediksi batas area terbakar (Burn Scar)",
      icon: <Scan className="h-4 w-4 text-rose-400" />,
      active: true,
      color: "border-rose-500/50 text-rose-400",
    },
    {
      id: "dnbr",
      name: "dNBR (Burn Severity)",
      description: "Tingkat keparahan kerusakan vegetasi satelit",
      icon: <Sliders className="h-4 w-4 text-purple-400" />,
      active: true,
      color: "border-purple-500/50 text-purple-400",
    },
    {
      id: "peatland",
      name: "Lahan Gambut",
      description: "Peta hidrologis & kedalaman gambut (BBSDLP)",
      icon: <Trees className="h-4 w-4 text-emerald-400" />,
      active: false,
      color: "border-emerald-500/50 text-emerald-400",
    },
    {
      id: "settlement",
      name: "Permukiman & Buffer",
      description: "Zona penyangga keselamatan warga (1 - 5 km)",
      icon: <Home className="h-4 w-4 text-cyan-400" />,
      active: false,
      color: "border-cyan-500/50 text-cyan-400",
    },
  ]);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedRegion, setSelectedRegion] = useState("Pulang Pisau, Kalteng");

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Fire Analysis Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualisasi multikomoditas spasial karhutla, komparasi temporal satelit, dan tumpang tindih risiko gambut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Wilayah:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-amber-400 font-medium focus:outline-none"
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
          <Card className="p-4 border-slate-800 bg-slate-900/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Layer Pengamatan Spasial
                </h3>
              </div>
              <span className="text-[11px] text-amber-400/90 font-mono">
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
                      ? "bg-slate-950/80 border-slate-700 shadow-sm"
                      : "bg-slate-950/30 border-slate-800/60 opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg border bg-slate-900 ${
                        layer.active ? layer.color : "border-slate-800 text-slate-500"
                      }`}
                    >
                      {layer.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {layer.name}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        {layer.description}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    {layer.active ? (
                      <Eye className="h-4 w-4 text-amber-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* dNBR Severity Legend */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs space-y-2">
              <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide block">
                Legenda Keparahan Kebakaran (dNBR)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Tidak Terbakar (&lt; 0.1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="text-slate-400">Keparahan Rendah</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <span className="text-slate-400">Keparahan Sedang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                  <span className="text-slate-400">Keparahan Tinggi (&gt; 0.66)</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Full-width Map Container & Before/After Comparison Slider (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <MapContainer
            height="h-[460px]"
            title={`Analisis Spasial: ${selectedRegion}`}
            activeLayers={activeLayerNames}
          />

          {/* Before/After Satellite Comparison Slider Placeholder */}
          <Card className="p-4 border-slate-800 bg-slate-900/90 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Komparasi Satelit Sebelum & Sesudah (Before / After Slider)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sensor: Landsat 8 OLI / TIRS
              </span>
            </div>

            {/* Visual Slider Simulator */}
            <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex select-none">
              {/* Left Side: Before Image Simulator */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-950/80 to-slate-900 flex flex-col justify-between p-4"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold w-fit">
                  <Calendar className="h-3 w-3" />
                  <span>SEBELUM: 02 Okt 2026</span>
                </div>
                <div className="text-xs text-emerald-200/90 font-medium bg-black/40 p-2 rounded backdrop-blur-sm max-w-xs">
                  Vegetasi hijau normal, tutupan kanopi utuh, NBR index baseline: 0.54
                </div>
              </div>

              {/* Right Side: After Image Simulator */}
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-950/80 to-amber-950/60 flex flex-col justify-between p-4 items-end text-right"
                style={{ width: `${100 - sliderPosition}%` }}
              >
                <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-semibold w-fit">
                  <Calendar className="h-3 w-3" />
                  <span>SESUDAH: 20 Okt 2026</span>
                </div>
                <div className="text-xs text-rose-200/90 font-medium bg-black/40 p-2 rounded backdrop-blur-sm max-w-xs">
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
              <span className="text-xs text-emerald-400 font-medium">Pra-Kebakaran</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-xs text-rose-400 font-medium">Pasca-Kebakaran</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
