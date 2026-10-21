"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import {
  SAMPLE_HOTSPOTS,
  createDrones,
  rankHotspots,
  stepDrone,
  type Drone,
  type Hotspot,
  type Place,
  type Severity,
} from "@/lib/monitoring";
import { cn } from "@/lib/utils";
import { SigapLogo } from "@/components/layout/sigap-logo";
import { NavMenu } from "@/components/layout/nav-menu";
import { LocationSearch } from "@/components/monitor/location-search";
import { SimulationToggle } from "@/components/monitor/simulation-toggle";
import { SeverityLegend } from "@/components/monitor/severity-legend";
import { ZoomControls } from "@/components/monitor/zoom-controls";
import { PriorityList } from "@/components/monitor/priority-list";
import { DroneStatus } from "@/components/monitor/drone-status";

const FireMap = dynamic(() => import("@/components/monitor/fire-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#c6ecf7]" />,
});

const PRIORITY_COUNT = 3;
const SIM_TICK_MS = 700;
/** Push the focused marker below the map centre so its detail card stays visible. */
const CARD_OFFSET_PX = 150;

export function MonitorDashboard() {
  const mapRef = useRef<L.Map | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenSeverities, setHiddenSeverities] = useState<Set<Severity>>(new Set());
  const [simulation, setSimulation] = useState(false);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [activeDroneId, setActiveDroneId] = useState("DRN-01");
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  const ranked = useMemo(() => rankHotspots(SAMPLE_HOTSPOTS), []);
  const rankById = useMemo(() => new Map(ranked.map((h, i) => [h.id, i + 1])), [ranked]);
  const visible = useMemo(
    () => ranked.filter((h) => !hiddenSeverities.has(h.severity)),
    [ranked, hiddenSeverities]
  );
  const priorities = visible.slice(0, PRIORITY_COUNT);
  const selectedHotspot = visible.find((h) => h.id === selectedId) ?? null;

  const onMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const focusHotspot = useCallback((hotspot: Hotspot, minZoom = 7) => {
    setSelectedId(hotspot.id);
    const map = mapRef.current;
    if (!map) return;
    const zoom = Math.max(map.getZoom(), minZoom);
    // Centre within the map area left uncovered by the desktop panel (hidden → offsetParent null)
    const panel = desktopPanelRef.current;
    const offsetX = panel?.offsetParent ? panel.offsetWidth / 2 : 0;
    const point = map.project([hotspot.lat, hotspot.lon], zoom).subtract([-offsetX, CARD_OFFSET_PX]);
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.8 });
  }, []);

  const onMapSelect = useCallback(
    (hotspot: Hotspot | null) => {
      if (hotspot) focusHotspot(hotspot, 0);
      else setSelectedId(null);
    },
    [focusHotspot]
  );

  const focusPlace = useCallback((place: Place) => {
    setSelectedId(null);
    mapRef.current?.flyTo([place.lat, place.lon], place.zoom, { duration: 0.8 });
  }, []);

  const toggleSeverity = (severity: Severity) => {
    setHiddenSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  };

  const toggleSimulation = (on: boolean) => {
    setSimulation(on);
    if (on) {
      // Dispatch each drone to one of the top-priority hotspots
      setDrones(
        createDrones().map((d, i) => ({
          ...d,
          targetId: priorities[i]?.id ?? null,
          mode: priorities[i] ? "Menuju target" : "Siaga",
        }))
      );
    } else {
      setDrones([]);
    }
  };

  useEffect(() => {
    if (!simulation) return;
    const timer = setInterval(() => {
      setDrones((prev) => prev.map((d) => stepDrone(d, SAMPLE_HOTSPOTS)));
    }, SIM_TICK_MS);
    return () => clearInterval(timer);
  }, [simulation]);

  const assignDrone = (droneId: string, hotspotId: string) =>
    setDrones((prev) =>
      prev.map((d) => (d.id === droneId ? { ...d, targetId: hotspotId, mode: "Menuju target" } : d))
    );

  const recallDrone = (droneId: string) =>
    setDrones((prev) => prev.map((d) => (d.id === droneId ? { ...d, mode: "Kembali ke base" } : d)));

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  const droneStatus = simulation && (
    <DroneStatus
      drones={drones}
      activeDroneId={activeDroneId}
      onSelectDrone={setActiveDroneId}
      selectedHotspot={selectedHotspot}
      onAssign={assignDrone}
      onRecall={recallDrone}
    />
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sigap-app">
      {/* navbar/desktop */}
      <header className="relative z-[1001] hidden h-[130px] shrink-0 items-center gap-10 bg-sigap-panel px-8 drop-shadow-[0_4px_2px_rgba(0,0,0,0.25)] xl:flex xl:gap-12 xl:px-[72px] 2xl:gap-[136px]">
        <SigapLogo />
        <LocationSearch
          hotspots={SAMPLE_HOTSPOTS}
          onSelectHotspot={(h) => focusHotspot(h)}
          onSelectPlace={focusPlace}
          className="min-w-0 max-w-[792px] flex-1"
        />
        <div className="ml-auto flex items-center gap-4">
          <SimulationToggle checked={simulation} onChange={toggleSimulation} />
          <NavMenu />
        </div>
      </header>

      {/* navbar/mobile */}
      <header className="relative z-[1001] shrink-0 bg-sigap-panel px-[25px] pb-3 pt-[17px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] xl:hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SigapLogo size="mobile" />
            <SimulationToggle checked={simulation} onChange={toggleSimulation} size="mobile" />
          </div>
          <div className="flex items-center gap-2">
            <LocationSearch
              size="mobile"
              hotspots={SAMPLE_HOTSPOTS}
              onSelectHotspot={(h) => focusHotspot(h)}
              onSelectPlace={focusPlace}
              className="min-w-0 flex-1"
            />
            <NavMenu size="mobile" />
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <div className="absolute inset-0 z-0">
          <FireMap
            hotspots={visible}
            rankById={rankById}
            selectedId={selectedId}
            onSelect={onMapSelect}
            onReady={onMapReady}
            drones={drones}
            activeDroneId={activeDroneId}
            onSelectDrone={setActiveDroneId}
          />
        </div>

        <SeverityLegend
          hidden={hiddenSeverities}
          onToggle={toggleSeverity}
          className="absolute left-[29px] top-[22px] z-[900] hidden xl:block"
        />
        <SeverityLegend
          size="mobile"
          hidden={hiddenSeverities}
          onToggle={toggleSeverity}
          className="absolute left-1/2 top-2 z-[900] w-[min(382px,calc(100%-16px))] -translate-x-1/2 xl:hidden"
        />

        {/* Desktop: zoom tiles + "Hotspot Prioritas" panel */}
        <div
          ref={desktopPanelRef}
          className="pointer-events-none absolute bottom-12 right-[26px] top-[-5px] z-[900] hidden items-end gap-[17px] xl:flex"
        >
          <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} className="pointer-events-auto" />
          <aside className="pointer-events-auto h-full w-[clamp(400px,31vw,539px)] overflow-y-auto rounded-[20px] bg-sigap-panel px-[42px] pb-10 pt-[59px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            <PriorityList hotspots={priorities} selectedId={selectedId} onSelect={(h) => focusHotspot(h)} />
            {droneStatus && <div className="mt-[72px]">{droneStatus}</div>}
          </aside>
        </div>

        <ZoomControls
          size="mobile"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          className="absolute bottom-[27px] right-[10px] z-[900] xl:hidden"
        />
      </main>

      {/* Mobile bottom sheet */}
      <section
        className={cn(
          "relative z-[950] -mt-5 shrink-0 overflow-y-auto rounded-t-[20px] bg-sigap-panel px-[38px] pb-8 xl:hidden",
          sheetCollapsed ? "max-h-[96px]" : "max-h-[48dvh]"
        )}
      >
        <button
          type="button"
          onClick={() => setSheetCollapsed((v) => !v)}
          aria-label={sheetCollapsed ? "Tampilkan panel" : "Ciutkan panel"}
          aria-expanded={!sheetCollapsed}
          className="mx-auto flex h-[35px] w-full cursor-pointer items-center justify-center"
        >
          <span className="h-1 w-12 rounded-full bg-slate-400" />
        </button>
        <PriorityList
          size="mobile"
          hotspots={priorities}
          selectedId={selectedId}
          onSelect={(h) => {
            setSheetCollapsed(true);
            focusHotspot(h);
          }}
        />
        {droneStatus && <div className="mt-[52px]">{droneStatus}</div>}
      </section>
    </div>
  );
}
