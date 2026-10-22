"use client";

import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  SEVERITY_META,
  buildDinov3CoverageRings,
  buildIndonesianPeatlandBasins,
  buildIndonesianSettlementZones,
  buildTacticalAllocationPlan,
  rawPointToHotspot,
  type Drone,
  type Hotspot,
  type TacticalDeploymentPoint,
} from "@/lib/monitoring";
import type {
  RawHotspotPoint,
  SegmentationResponse,
  SpatialContextResponse,
} from "@/lib/api";
import { HOTSPOT_CARD_TIP, HotspotCard } from "@/components/monitor/hotspot-card";

const INDONESIA_CENTER: L.LatLngTuple = [-2.2, 118.0];
const SELECTED_SIZE = 40;

export type BasemapStyle = "physical" | "satellite" | "roadmap" | "terrain";

function fireIcon(hotspot: Hotspot, selected: boolean): L.DivIcon {
  const meta = SEVERITY_META[hotspot.severity];
  if (selected) {
    return L.divIcon({
      className: "sigap-marker",
      iconSize: [SELECTED_SIZE, SELECTED_SIZE],
      iconAnchor: [SELECTED_SIZE / 2, SELECTED_SIZE / 2],
      html: `<div style="width:${SELECTED_SIZE}px;height:${SELECTED_SIZE}px;border-radius:9999px;border:1.5px dashed ${meta.color};background:${meta.surface.replace(/[\d.]+\)$/, "0.5)")};display:flex;align-items:center;justify-content:center;cursor:pointer"><img src="${hotspot.severity === "tinggi" ? "/figma/fire-selected.svg" : meta.icon}" width="14" height="18" alt="" style="display:block;max-width:none"/></div>`,
    });
  }
  return L.divIcon({
    className: "sigap-marker",
    iconSize: [14, 18],
    iconAnchor: [7, 9],
    html: `<img src="${meta.icon}" width="14" height="18" alt="" style="display:block;max-width:none;cursor:pointer"/>`,
  });
}

function rawFireIcon(frp: number, confidence?: string): L.DivIcon {
  const conf = String(confidence ?? "").toLowerCase();
  const severity =
    frp >= 28 || conf === "high" || conf === "h"
      ? "tinggi"
      : frp >= 12 || conf === "nominal" || conf === "n"
      ? "sedang"
      : "rendah";
  const iconSrc = SEVERITY_META[severity].icon;
  return L.divIcon({
    className: "sigap-marker",
    iconSize: [12, 16],
    iconAnchor: [6, 8],
    html: `<img src="${iconSrc}" width="12" height="16" alt="" style="display:block;max-width:none;cursor:pointer;opacity:0.92"/>`,
  });
}

function droneIcon(drone: Drone, active: boolean): L.DivIcon {
  const size = active ? 28 : 24;
  return L.divIcon({
    className: "sigap-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#1170d5;border:2px solid #f8fafc;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font:700 11px var(--font-jetbrains-mono),monospace">${drone.name.slice(-1)}</div>`,
  });
}

function tacticalBadgeIcon(pt: TacticalDeploymentPoint): L.DivIcon {
  const isBase = pt.code === "BASE";
  const width = isBase ? 52 : 46;
  return L.divIcon({
    className: "sigap-tactical-marker",
    iconSize: [width, 22],
    iconAnchor: [width / 2, 11],
    html: `<div style="padding:2px 6px;border-radius:6px;background:${pt.badgeColor};border:1.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.45);color:#ffffff;font:700 9.5px var(--font-jetbrains-mono),monospace;text-align:center;white-space:nowrap;cursor:pointer">${pt.code}</div>`,
  });
}

function routeArrowIcon(color: string, rotationDeg: number, label: string): L.DivIcon {
  return L.divIcon({
    className: "sigap-route-arrow",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div title="${label}" style="width:20px;height:20px;border-radius:9999px;background:${color};border:1.5px solid #ffffff;box-shadow:0 1px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:9px;transform:rotate(${rotationDeg}deg);cursor:pointer">▲</div>`,
  });
}

/** Docked compact hotspot detail card at bottom-left so the fire perimeter & tactical popups remain 100% unobstructed. */
function SelectedCard({
  hotspot,
  rank,
  onInvestigate,
  onClose,
}: {
  hotspot: Hotspot;
  rank: number;
  onInvestigate?: (hotspot: Hotspot) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute bottom-12 left-2.5 sm:bottom-14 sm:left-3 z-[920] max-w-[calc(100vw-20px)]"
    >
      <HotspotCard
        hotspot={hotspot}
        priorityRank={rank}
        onInvestigate={onInvestigate}
        onClose={onClose}
      />
    </div>
  );
}

function MapBridge({
  onReady,
  onBackgroundClick,
  onZoomChange,
  onPopupChange,
}: {
  onReady: (map: L.Map) => void;
  onBackgroundClick: () => void;
  onZoomChange: (zoom: number) => void;
  onPopupChange: (open: boolean) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map, onReady]);

  useMapEvents({
    click: onBackgroundClick,
    zoomend: () => onZoomChange(map.getZoom()),
    popupopen: () => onPopupChange(true),
    popupclose: () => onPopupChange(false),
  });
  return null;
}

export interface FireMapProps {
  hotspots: Hotspot[];
  rankById: Map<string, number>;
  selectedId: string | null;
  onSelect: (hotspot: Hotspot | null) => void;
  onInvestigate?: (hotspot: Hotspot) => void;
  onReady: (map: L.Map) => void;
  drones?: Drone[];
  activeDroneId?: string;
  onSelectDrone?: (id: string) => void;
  basemap?: BasemapStyle;
  activeLayerIds?: Set<string>;
  rawHotspots?: RawHotspotPoint[];
  segmentation?: SegmentationResponse | null;
  spatialContext?: SpatialContextResponse | null;
}

export default function FireMap({
  hotspots,
  rankById,
  selectedId,
  onSelect,
  onInvestigate,
  onReady,
  drones = [],
  activeDroneId,
  onSelectDrone,
  basemap = "physical",
  activeLayerIds,
  rawHotspots = [],
  segmentation = null,
  spatialContext = null,
}: FireMapProps) {
  const [mapZoom, setMapZoom] = useState(5);
  const [hasOpenPopup, setHasOpenPopup] = useState(false);

  const rawHotspotItems = useMemo(() => {
    const seenIds = new Set<string>();
    return rawHotspots
      .slice(0, 300)
      .map((hs, idx) => rawPointToHotspot(hs, idx, hotspots))
      .filter((rh) => {
        if (seenIds.has(rh.id)) return false;
        seenIds.add(rh.id);
        return !hotspots.some(
          (h) => Math.abs(h.lat - rh.lat) < 0.002 && Math.abs(h.lon - rh.lon) < 0.002
        );
      });
  }, [rawHotspots, hotspots]);

  const selected = useMemo(
    () =>
      hotspots.find((h) => h.id === selectedId) ??
      rawHotspotItems.find((h) => h.id === selectedId) ??
      null,
    [hotspots, rawHotspotItems, selectedId]
  );

  const hotspotsWithZones = useMemo(
    () =>
      selected && !hotspots.some((h) => h.id === selected.id)
        ? [...hotspots, selected]
        : hotspots,
    [hotspots, selected]
  );

  const hotspotById = useMemo(
    () => new Map([...rawHotspotItems, ...hotspots].map((h) => [h.id, h])),
    [hotspots, rawHotspotItems]
  );

  useEffect(() => {
    setHasOpenPopup(false);
  }, [selectedId]);

  const showHotspots = !activeLayerIds || activeLayerIds.has("hotspots");
  const showSegmentation = !activeLayerIds || activeLayerIds.has("segmentation");
  const showDnbr = !activeLayerIds || activeLayerIds.has("dnbr");
  const showPeatland = !activeLayerIds || activeLayerIds.has("peatland");
  const showSettlement = !activeLayerIds || activeLayerIds.has("settlement");

  const peatlandBasins = useMemo(() => buildIndonesianPeatlandBasins(), []);
  const settlementZones = useMemo(() => buildIndonesianSettlementZones(hotspots), [hotspots]);

  return (
    <MapContainer
      center={INDONESIA_CENTER}
      zoom={5}
      minZoom={4}
      maxZoom={18}
      zoomControl={false}
      attributionControl
      worldCopyJump
      className="sigap-monitor-map size-full"
    >
      {basemap === "physical" && (
        <>
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
            maxZoom={18}
          />
        </>
      )}
      {basemap === "satellite" && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps (Satellite Hybrid)"
          maxZoom={18}
        />
      )}
      {basemap === "roadmap" && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
          maxZoom={18}
        />
      )}
      {basemap === "terrain" && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps (Terrain)"
          maxZoom={18}
        />
      )}

      <MapBridge
        onReady={onReady}
        onBackgroundClick={() => onSelect(null)}
        onZoomChange={setMapZoom}
        onPopupChange={setHasOpenPopup}
      />

      {/* 1. Independent KLHK KHG Peatland Basins + Live OSM Peatland Polygons */}
      {showPeatland &&
        peatlandBasins.map((dome) => (
          <Polygon
            key={dome.id}
            positions={dome.positions}
            pathOptions={{
              color: "#059669",
              weight: 2,
              fillColor: "#10b981",
              fillOpacity: 0.24,
              dashArray: "6 5",
            }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-emerald-700">🌲 {dome.name}</div>
                <div>Karakteristik: {dome.soil}</div>
                <div>Luas KHG: {dome.areaHaLabel}</div>
                <div>Wilayah: {dome.district}</div>
                <div>Sumber: Peta KHG KLHK (Geografi Independen)</div>
              </div>
            </Popup>
          </Polygon>
        ))}

      {showPeatland &&
        spatialContext?.peatland_polygons?.map((peat, idx) => {
          const ring = peat.coordinates?.[0] || [];
          const latLngs: [number, number][] = ring.map((pt: number[]) => [pt[1], pt[0]]);
          if (latLngs.length < 3) return null;
          return (
            <Polygon
              key={`peat-osm-${idx}`}
              positions={latLngs}
              pathOptions={{
                color: "#047857",
                weight: 2,
                fillColor: "#059669",
                fillOpacity: 0.28,
                dashArray: "4 4",
              }}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-emerald-700">🌲 {peat.name}</div>
                  <div>Karakteristik: {peat.natural_type}</div>
                  <div>Sumber: {peat.source}</div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

      {/* 2. DINOv3 BurnSeg Covered Area Overlays (Clusters + any clicked small fire) */}
      {(showSegmentation || showDnbr) &&
        hotspotsWithZones.map((h) => {
          const rings = buildDinov3CoverageRings(h, mapZoom);
          return (
            <Fragment key={`${h.id}-dinov3`}>
              {rings.map((ring) => {
                if (!showSegmentation && showDnbr && ring.tier !== "CORE_DEEPRED" && ring.tier !== "INNER_ORANGE") {
                  return null;
                }
                return (
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
                );
              })}
            </Fragment>
          );
        })}

      {/* 3. Detailed DINOv3 Backend GeoJSON Segmentation */}
      {showSegmentation &&
        segmentation?.geojson?.features?.map((feat, idx) => {
          const props = feat.properties || {};
          const tier = String(props.severity_tier || "LOW").toUpperCase();
          const coordsRing = feat.geometry?.coordinates?.[0] || [];
          const latLngs: [number, number][] = coordsRing.map((pt: number[]) => [pt[1], pt[0]]);
          if (latLngs.length < 3) return null;
          const style =
            tier === "HIGH"
              ? { color: "#7f1d1d", weight: 2, fillColor: "#991b1b", fillOpacity: 0.68 }
              : tier === "MODERATE"
              ? { color: "#dc2626", weight: 1.6, fillColor: "#ef4444", fillOpacity: 0.48 }
              : tier === "MODERATE_LOW"
              ? { color: "#f97316", weight: 1.4, fillColor: "#fb923c", fillOpacity: 0.35 }
              : { color: "#eab308", weight: 1.2, fillColor: "#fde047", fillOpacity: 0.25, dashArray: "4 4" };
          return <Polygon key={`seg-feat-${idx}`} positions={latLngs} pathOptions={style} />;
        })}

      {/* 4. Independent Indonesian Cities/Regency Settlements + Live OSM Settlements */}
      {showSettlement &&
        settlementZones.map((st) => (
          <Fragment key={st.id}>
            <Polygon
              positions={st.bufferPositions}
              pathOptions={{
                color: "#0891b2",
                weight: 1.5,
                fillColor: "#06b6d4",
                fillOpacity: 0.18,
                dashArray: "3 3",
              }}
            />
            <CircleMarker
              center={[st.lat, st.lon]}
              radius={6}
              pathOptions={{
                fillColor: "#0891b2",
                color: "#ffffff",
                weight: 2,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-cyan-800">
                    🏘️ {st.name} ({st.placeType})
                  </div>
                  <div>Provinsi/Wilayah: {st.province}</div>
                  <div>Estimasi populasi: {st.population}</div>
                  <div>Radius buffer proteksi: {st.bufferRadiusKm} km</div>
                  {st.nearestFireKm !== null && (
                    <div>Jarak ke klaster api terdekat: {st.nearestFireKm} km</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}

      {showSettlement &&
        spatialContext?.settlements?.map((st, idx) => (
          <Fragment key={`settle-osm-${idx}`}>
            <Circle
              center={[st.lat, st.lon]}
              radius={st.buffer_m || 2000}
              pathOptions={{
                color: "#0891b2",
                weight: 1.5,
                fillColor: "#22d3ee",
                fillOpacity: 0.16,
              }}
            />
            <CircleMarker
              center={[st.lat, st.lon]}
              radius={6}
              pathOptions={{
                fillColor: "#06b6d4",
                color: "#ffffff",
                weight: 2,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-cyan-800">
                    🏘️ {st.name} ({st.place_type})
                  </div>
                  <div>Jarak ke api: {st.distance_km} km</div>
                  <div>Populasi: {st.population}</div>
                  <div>Sumber: {st.source}</div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}

      {/* 5. Raw FIRMS Hotspot Points labeled with clickable fire logos that show zones when selected */}
      {showHotspots &&
        mapZoom >= 4 &&
        rawHotspotItems.map((rh) => {
          const isSelected = rh.id === selectedId;
          return (
            <Marker
              key={rh.id}
              position={[rh.lat, rh.lon]}
              icon={
                isSelected
                  ? fireIcon(rh, true)
                  : rawFireIcon(
                      rh.totalFrp ?? 15,
                      rh.severity === "tinggi"
                        ? "high"
                        : rh.severity === "sedang"
                        ? "nominal"
                        : "low"
                    )
              }
              zIndexOffset={isSelected ? 500 : 100}
              title={`${rh.id} — ${rh.location} (${SEVERITY_META[rh.severity].label})`}
              eventHandlers={{ click: () => onSelect(rh) }}
            />
          );
        })}

      {/* 6. Drone Routes */}
      {drones.map((d) => {
        const target = d.targetId ? hotspotById.get(d.targetId) : undefined;
        const dest: L.LatLngTuple | null =
          d.mode === "Kembali ke base"
            ? d.base
            : target && d.mode === "Menuju target"
            ? [target.lat, target.lon]
            : null;
        return dest ? (
          <Polyline
            key={`${d.id}-route`}
            positions={[[d.lat, d.lon], dest]}
            pathOptions={{ color: "#1170d5", weight: 2, dashArray: "6 6", opacity: 0.9 }}
          />
        ) : null;
      })}

      {/* 7. Clustered Hotspot Markers */}
      {showHotspots &&
        hotspots.map((h) => (
          <Marker
            key={h.id}
            position={[h.lat, h.lon]}
            icon={fireIcon(h, h.id === selectedId)}
            zIndexOffset={h.id === selectedId ? 500 : 0}
            title={`${h.id} — ${SEVERITY_META[h.severity].label}`}
            eventHandlers={{ click: () => onSelect(h) }}
          />
        ))}

      {/* 8. Tactical Perimeter Resource Allocation & Fleet Dispatch Routings for Selected Cluster */}
      {selected &&
        (() => {
          const plan = buildTacticalAllocationPlan(selected, mapZoom);
          return (
            <Fragment key={`tactical-${selected.id}`}>
              {plan.routes.map((rt) => (
                <Fragment key={rt.id}>
                  {/* White halo casing so route stands out clearly over satellite/terrain basemaps */}
                  <Polyline
                    positions={rt.positions}
                    pathOptions={{
                      color: "#ffffff",
                      weight: rt.weight + 2.4,
                      opacity: 0.72,
                    }}
                  />
                  <Polyline
                    positions={rt.positions}
                    pathOptions={{
                      color: rt.color,
                      weight: rt.weight,
                      dashArray: rt.dashArray,
                      opacity: 0.96,
                    }}
                  >
                    <Popup autoPan={true}>
                      <div className="max-w-[230px] space-y-1 text-xs">
                        <div className="font-bold text-slate-900">🛣️ {rt.name}</div>
                        <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold text-slate-700">
                          <span>Jarak: {rt.distanceKm} km</span>
                          <span>•</span>
                          <span>ETA: ~{rt.etaMin} mnt</span>
                        </div>
                        <div className="rounded bg-slate-100 p-1 text-[10.5px] text-slate-700">
                          {rt.description}
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                  <Marker
                    position={rt.arrowMidpoint}
                    icon={routeArrowIcon(rt.color, rt.arrowRotationDeg, rt.name)}
                    zIndexOffset={1100}
                    title={`${rt.name} (${rt.distanceKm} km • ~${rt.etaMin} mnt)`}
                  >
                    <Popup autoPan={true}>
                      <div className="max-w-[230px] space-y-1 text-xs">
                        <div className="font-bold text-slate-900">🛣️ {rt.name}</div>
                        <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold text-slate-700">
                          <span>Jarak: {rt.distanceKm} km</span>
                          <span>•</span>
                          <span>ETA: ~{rt.etaMin} mnt</span>
                        </div>
                        <div className="rounded bg-slate-100 p-1 text-[10.5px] text-slate-700">
                          {rt.description}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              ))}
              <Polyline
                positions={plan.cutlineArc}
                pathOptions={{
                  color: "#d97706",
                  weight: 3.4,
                  dashArray: "7 4",
                  opacity: 0.96,
                }}
              />
              {plan.points.map((pt) => (
                <Marker
                  key={`tac-pt-${pt.code}`}
                  position={[pt.lat, pt.lon]}
                  icon={tacticalBadgeIcon(pt)}
                  zIndexOffset={1400}
                  title={`${pt.code} — ${pt.name}`}
                >
                  <Popup autoPan={true} offset={[0, -8]}>
                    <div className="max-w-[240px] space-y-1 text-xs">
                      <div className="font-bold text-slate-900">
                        [{pt.code}] {pt.name}
                      </div>
                      <div className="font-mono text-[10.5px] text-slate-600">
                        GPS: {pt.lat.toFixed(4)}°, {pt.lon.toFixed(4)}°
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Alokasi Unit:</span>{" "}
                        {pt.assignedUnit}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Peralatan:</span>{" "}
                        {pt.equipment}
                      </div>
                      <div className="rounded bg-slate-100 p-1 text-[10.5px] text-slate-700">
                        {pt.rationale}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </Fragment>
          );
        })()}

      {/* 9. Drone Markers */}
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

      {selected && !hasOpenPopup && (
        <SelectedCard
          hotspot={selected}
          rank={rankById.get(selected.id) ?? 0}
          onInvestigate={onInvestigate}
          onClose={() => onSelect(null)}
        />
      )}
    </MapContainer>
  );
}
