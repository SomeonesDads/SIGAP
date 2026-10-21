"use client";

import React from "react";
import { MapPin, Layers, Compass, ZoomIn, ZoomOut } from "lucide-react";
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
  activeLayers = ["Hotspots", "Batas Administrasi"],
  interactive = true,
  title,
}: MapContainerProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner flex flex-col items-center justify-center",
        height,
        className
      )}
    >
      {/* Background stylized satellite/spatial grid simulation */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow for active hotspot cluster simulation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Map Header / Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md text-slate-200">
        <Compass className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="font-semibold">{title || "Peta Analisis Spasial Karhutla"}</span>
        <span className="text-slate-400 border-l border-slate-700 pl-2">
          {center[0].toFixed(4)}°, {center[1].toFixed(4)}°
        </span>
      </div>

      {/* Layer badges on top right */}
      {activeLayers.length > 0 && (
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5">
          {activeLayers.map((layer) => (
            <span
              key={layer}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/90 border border-slate-700/80 text-amber-300 backdrop-blur-md flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {layer}
            </span>
          ))}
        </div>
      )}

      {/* Center placeholder info ready for Leaflet */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <MapPin className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-100">
          Map will render here
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Leaflet & React-Leaflet integration container. Mendukung visualisasi titik panas NASA FIRMS, segmentasi U-Net, dan dNBR overlay.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <span>Zoom: {zoom}x • Center: [{center.join(", ")}]</span>
        </div>
      </div>

      {/* Bottom map control buttons simulation */}
      {interactive && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-lg backdrop-blur-md">
          <button
            type="button"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
