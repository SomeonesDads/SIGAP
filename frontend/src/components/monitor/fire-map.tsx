"use client";

import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  SEVERITY_META,
  buildDinov3CoverageRings,
  type Drone,
  type Hotspot,
} from "@/lib/monitoring";
import { HOTSPOT_CARD_TIP, HotspotCard } from "@/components/monitor/hotspot-card";

const INDONESIA_CENTER: L.LatLngTuple = [-2.2, 118.0];
const SELECTED_SIZE = 50;

function fireIcon(hotspot: Hotspot, selected: boolean): L.DivIcon {
  const meta = SEVERITY_META[hotspot.severity];
  if (selected) {
    // Figma 50:1033 — dashed highlight ring around the selected hotspot
    return L.divIcon({
      className: "sigap-marker",
      iconSize: [SELECTED_SIZE, SELECTED_SIZE],
      iconAnchor: [SELECTED_SIZE / 2, SELECTED_SIZE / 2],
      html: `<div style="width:${SELECTED_SIZE}px;height:${SELECTED_SIZE}px;border-radius:25px;border:1px dashed ${meta.color};background:${meta.surface.replace(/[\d.]+\)$/, "0.5)")};display:flex;align-items:center;justify-content:center;cursor:pointer"><img src="${hotspot.severity === "tinggi" ? "/figma/fire-selected.svg" : meta.icon}" width="14" height="18" alt="" style="display:block;max-width:none"/></div>`,
    });
  }
  return L.divIcon({
    className: "sigap-marker",
    iconSize: [14, 18],
    iconAnchor: [7, 9],
    html: `<img src="${meta.icon}" width="14" height="18" alt="" style="display:block;max-width:none;cursor:pointer"/>`,
  });
}

function droneIcon(drone: Drone, active: boolean): L.DivIcon {
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "sigap-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#1170d5;border:3px solid #f8fafc;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px var(--font-jetbrains-mono),monospace">${drone.name.slice(-1)}</div>`,
  });
}

/** Floating Figma "Frame 21" card anchored above the selected marker. */
function SelectedCard({ hotspot, rank }: { hotspot: Hotspot; rank: number }) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState(() => map.latLngToContainerPoint([hotspot.lat, hotspot.lon]));

  const update = () => setPoint(map.latLngToContainerPoint([hotspot.lat, hotspot.lon]));
  useMapEvents({ move: update, zoom: update, resize: update });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(update, [hotspot.id]);

  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute z-[1000]"
      style={{
        left: point.x - HOTSPOT_CARD_TIP.x,
        top: point.y - SELECTED_SIZE / 2 - HOTSPOT_CARD_TIP.y - 2,
      }}
    >
      <HotspotCard hotspot={hotspot} priorityRank={rank} />
    </div>
  );
}

function MapBridge({
  onReady,
  onBackgroundClick,
  onZoomChange,
}: {
  onReady: (map: L.Map) => void;
  onBackgroundClick: () => void;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();
  useEffect(() => onReady(map), [map, onReady]);
  useMapEvents({
    click: onBackgroundClick,
    zoomend: () => onZoomChange(map.getZoom()),
  });
  return null;
}

export interface FireMapProps {
  hotspots: Hotspot[];
  rankById: Map<string, number>;
  selectedId: string | null;
  onSelect: (hotspot: Hotspot | null) => void;
  onReady: (map: L.Map) => void;
  drones?: Drone[];
  activeDroneId?: string;
  onSelectDrone?: (id: string) => void;
}

export default function FireMap({
  hotspots,
  rankById,
  selectedId,
  onSelect,
  onReady,
  drones = [],
  activeDroneId,
  onSelectDrone,
}: FireMapProps) {
  const [mapZoom, setMapZoom] = useState(5);
  const selected = hotspots.find((h) => h.id === selectedId) ?? null;
  const hotspotById = useMemo(() => new Map(hotspots.map((h) => [h.id, h])), [hotspots]);

  return (
    <MapContainer
      center={INDONESIA_CENTER}
      zoom={5}
      minZoom={4}
      maxZoom={13}
      zoomControl={false}
      attributionControl
      worldCopyJump
      className="sigap-monitor-map size-full"
    >
      {/* Shaded-relief physical basemap matches the Figma map style; topo detail when zoomed in */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri — US National Park Service"
        maxZoom={8}
        maxNativeZoom={8}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        minZoom={9}
        maxZoom={13}
      />

      <MapBridge
        onReady={onReady}
        onBackgroundClick={() => onSelect(null)}
        onZoomChange={setMapZoom}
      />

      {/* DINOv3 BurnSeg Covered Area Overlays (Yellowish outer -> Amber-Orange -> Red-Orange -> Deep Red core) */}
      {hotspots.map((h) => {
        const rings = buildDinov3CoverageRings(h, mapZoom);
        return (
          <Fragment key={`${h.id}-dinov3`}>
            {rings.map((ring) => (
              <Polygon
                key={`${h.id}-${ring.tier}`}
                positions={ring.positions}
                pathOptions={{
                  color: ring.strokeColor,
                  weight: h.id === selectedId ? ring.weight + 0.8 : ring.weight,
                  fillColor: ring.fillColor,
                  fillOpacity: h.id === selectedId ? Math.min(0.88, ring.fillOpacity + 0.12) : ring.fillOpacity,
                  dashArray: ring.dashArray,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    onSelect(h);
                  },
                }}
              />
            ))}
          </Fragment>
        );
      })}

      {drones.map((d) => {
        const target = d.targetId ? hotspotById.get(d.targetId) : undefined;
        const dest: L.LatLngTuple | null =
          d.mode === "Kembali ke base" ? d.base : target && d.mode === "Menuju target" ? [target.lat, target.lon] : null;
        return dest ? (
          <Polyline
            key={`${d.id}-route`}
            positions={[[d.lat, d.lon], dest]}
            pathOptions={{ color: "#1170d5", weight: 2, dashArray: "6 6", opacity: 0.9 }}
          />
        ) : null;
      })}

      {hotspots.map((h) => (
        <Marker
          key={h.id}
          position={[h.lat, h.lon]}
          icon={fireIcon(h, h.id === selectedId)}
          zIndexOffset={h.id === selectedId ? 500 : 0}
          title={`${h.id} — ${SEVERITY_META[h.severity].label}`}
          eventHandlers={{ click: () => onSelect(h) }}
        />
      ))}

      {drones.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lon]}
          icon={droneIcon(d, d.id === activeDroneId)}
          zIndexOffset={1000}
          title={`${d.name} — ${d.mode}`}
          eventHandlers={{ click: () => onSelectDrone?.(d.id) }}
        />
      ))}

      {selected && <SelectedCard hotspot={selected} rank={rankById.get(selected.id) ?? 0} />}
    </MapContainer>
  );
}
