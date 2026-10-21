"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import {
  Activity,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  DownloadCloud,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Home,
  Layers,
  Loader2,
  Map as MapIcon,
  MessageSquare,
  RotateCcw,
  Scan,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trees,
  X,
} from "lucide-react";
import {
  SAMPLE_HOTSPOTS,
  createDrones,
  rankHotspots,
  stepSimulation,
  type Drone,
  type Hotspot,
  type Place,
  type Severity,
} from "@/lib/monitoring";
import {
  fetchMonitoringHotspots,
  fetchRawHotspots,
  fetchReportGeoJSON,
  fetchReports,
  fetchSegmentationData,
  fetchSpatialContext,
  getReportDownloadUrl,
  type LiveReportItem,
  type RawHotspotPoint,
  type SegmentationResponse,
  type SpatialContextResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { SigapLogo } from "@/components/layout/sigap-logo";
import { LocationSearch } from "@/components/monitor/location-search";
import { SimulationToggle } from "@/components/monitor/simulation-toggle";
import { SeverityLegend } from "@/components/monitor/severity-legend";
import { ZoomControls } from "@/components/monitor/zoom-controls";
import { PriorityList } from "@/components/monitor/priority-list";
import { DroneStatus } from "@/components/monitor/drone-status";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import type { BasemapStyle } from "@/components/monitor/fire-map";

const FireMap = dynamic(() => import("@/components/monitor/fire-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#c6ecf7]" />,
});

const PRIORITY_COUNT = 4;
const SIM_TICK_MS = 700;
const LIVE_REFRESH_MS = 60_000;

export type BottomDrawerTab = "none" | "priority" | "reports";
export type MobileWorkspaceView = "split" | "map" | "chat";
type CriteriaFilter = "all" | "critical" | "peatland" | "settlement";

interface LayerToggleItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  colorClass: string;
}

const SPATIAL_LAYERS: LayerToggleItem[] = [
  {
    id: "hotspots",
    label: "Titik Panas NASA FIRMS (VIIRS 375m)",
    shortLabel: "Hotspot",
    icon: <Flame className="size-3 text-amber-600" />,
    colorClass: "border-amber-500/40 bg-amber-500/10 text-amber-900",
  },
  {
    id: "segmentation",
    label: "Segmentasi DINOv3 BurnSeg",
    shortLabel: "DINOv3",
    icon: <Scan className="size-3 text-rose-600" />,
    colorClass: "border-rose-500/40 bg-rose-500/10 text-rose-900",
  },
  {
    id: "dnbr",
    label: "dNBR (Burn Severity)",
    shortLabel: "dNBR",
    icon: <Sliders className="size-3 text-orange-600" />,
    colorClass: "border-orange-500/40 bg-orange-500/10 text-orange-900",
  },
  {
    id: "peatland",
    label: "Lahan Gambut & Rawa (OSM/KHG)",
    shortLabel: "Gambut",
    icon: <Trees className="size-3 text-emerald-600" />,
    colorClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900",
  },
  {
    id: "settlement",
    label: "Permukiman & Buffer 2km (OSM)",
    shortLabel: "Permukiman",
    icon: <Home className="size-3 text-cyan-600" />,
    colorClass: "border-cyan-500/40 bg-cyan-500/10 text-cyan-900",
  },
];

const INITIAL_REPORTS: LiveReportItem[] = [
  {
    id: "REP-2026-001",
    caseNumber: "SIGAP-2026-089",
    region: "Pulang Pisau, Kalimantan Tengah",
    date: "21 Okt 2026",
    status: "Draft",
    examiner: "SIGAP Agent AI (Manggala Agni Daops Kapuas)",
    summary:
      "Deteksi 18 titik panas VIIRS di lahan gambut dalam (>3m). Estimasi DINOv3 1,240 Ha. Skor prioritas 95 (Kritis).",
    totalBurnedAreaHa: 1240,
    priorityScore: 95,
    exportFormats: ["pdf", "geojson"],
    lat: -2.85,
    lon: 114.12,
  },
];

export interface MonitorDashboardProps {
  initialDrawer?: BottomDrawerTab;
  initialQuery?: string | null;
}

export function MonitorDashboard({
  initialDrawer = "none",
  initialQuery = null,
}: MonitorDashboardProps = {}) {
  const mapRef = useRef<L.Map | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map & Hotspot state
  const [hotspots, setHotspots] = useState<Hotspot[]>(SAMPLE_HOTSPOTS);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenSeverities, setHiddenSeverities] = useState<Set<Severity>>(new Set());
  const [basemap, setBasemap] = useState<BasemapStyle>("physical");
  const [activeLayerIds, setActiveLayerIds] = useState<Set<string>>(
    () => new Set(["hotspots", "segmentation", "dnbr", "peatland", "settlement"])
  );

  // Mobile responsive view & collapsible overlays
  const [mobileView, setMobileView] = useState<MobileWorkspaceView>("split");
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);

  // Spatial Context state for active/focused cluster
  const [rawHotspots, setRawHotspots] = useState<RawHotspotPoint[]>([]);
  const [segmentation, setSegmentation] = useState<SegmentationResponse | null>(null);
  const [spatialContext, setSpatialContext] = useState<SpatialContextResponse | null>(null);

  // Drone Simulation state
  const [simulation, setSimulation] = useState(false);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [activeDroneId, setActiveDroneId] = useState("DRN-01");
  const [priorityOverlayCollapsed, setPriorityOverlayCollapsed] = useState(false);

  // Collapse priority overlay by default on narrow mobile screens (< 768px)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setPriorityOverlayCollapsed(true);
    }
  }, []);

  // Re-validate Leaflet canvas size when mobile view or drawer tab toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [mobileView, initialDrawer]);

  // Bottom Drawer state (inside Map column — keeps both Map and Chat visible!)
  const [drawerTab, setDrawerTab] = useState<BottomDrawerTab>(initialDrawer);
  const [criteriaFilter, setCriteriaFilter] = useState<CriteriaFilter>("all");
  const [expandedPrioId, setExpandedPrioId] = useState<string | null>(null);

  // Reports state
  const [reports, setReports] = useState<LiveReportItem[]>(INITIAL_REPORTS);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  // AI Investigation Chat state (Right column — always visible)
  const {
    messages,
    isLoading,
    currentSteps,
    decisionLogs,
    activeCluster,
    focusSeq,
    sendMessage,
    clearMessages,
  } = useChat();
  const [showAgentTrace, setShowAgentTrace] = useState(false);
  const [traceSubTab, setTraceSubTab] = useState<"steps" | "logs">("steps");

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Trigger initial query if passed
  const initialQuerySentRef = useRef(false);
  useEffect(() => {
    if (initialQuery && !initialQuerySentRef.current) {
      initialQuerySentRef.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage]);

  const simulationRef = useRef(false);
  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  // 1. Poll live FIRMS clusters across Indonesia
  useEffect(() => {
    let active = true;
    const loadLive = async () => {
      const data = await fetchMonitoringHotspots("Indonesia", 35);
      if (!active) return;
      if (simulationRef.current) {
        if (data.hotspots.length > 0) {
          preSimHotspotsRef.current = data.hotspots;
        }
        setIsLiveFeed((prev) => prev || data.is_live);
        return;
      }
      setHotspots((prev) => {
        if (!data.is_live && prev.some((h) => h.isLive)) return prev;
        return data.hotspots;
      });
      setIsLiveFeed((prev) => prev || data.is_live);
    };
    loadLive();
    const pollTimer = setInterval(loadLive, LIVE_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(pollTimer);
    };
  }, []);

  // 2. Load live case reports
  useEffect(() => {
    let active = true;
    fetchReports("Indonesia", 15).then((res) => {
      if (!active || !res || !res.reports.length) return;
      setReports(res.reports);
    });
    return () => {
      active = false;
    };
  }, []);

  const ranked = useMemo(() => rankHotspots(hotspots), [hotspots]);
  const rankById = useMemo(() => new Map(ranked.map((h, i) => [h.id, i + 1])), [ranked]);
  const visible = useMemo(
    () => ranked.filter((h) => !hiddenSeverities.has(h.severity)),
    [ranked, hiddenSeverities]
  );
  const priorities = visible.slice(0, PRIORITY_COUNT);
  const selectedHotspot =
    visible.find((h) => h.id === selectedId) ??
    (activeCluster && activeCluster.id === selectedId ? activeCluster : null);

  // Determine active focus coordinates for spatial layers & imagery comparison
  const focusTarget = selectedHotspot ?? activeCluster ?? ranked[0] ?? SAMPLE_HOTSPOTS[0];

  // 3. Fetch raw hotspots, DINOv3 segmentation, and OSM context for focused cluster
  useEffect(() => {
    if (!focusTarget) return;
    let active = true;
    const lat = focusTarget.lat;
    const lon = focusTarget.lon;
    const count = focusTarget.hotspotCount ?? 1;
    const scale = Math.min(2.4, Math.max(0.7, 0.75 + Math.log10(Math.max(1, count)) * 0.55));
    const bboxQuery = `${(lon - 2.0).toFixed(2)},${(lat - 2.0).toFixed(2)},${(lon + 2.0).toFixed(2)},${(lat + 2.0).toFixed(2)}`;

    Promise.all([
      fetchRawHotspots(bboxQuery, 150),
      fetchSegmentationData(lat, lon, Number(scale.toFixed(2))),
      fetchSpatialContext(lat, lon),
    ]).then(([pts, seg, ctx]) => {
      if (!active) return;
      setRawHotspots(pts);
      setSegmentation(seg);
      setSpatialContext(ctx);
    });

    return () => {
      active = false;
    };
  }, [focusTarget?.id, focusTarget?.lat, focusTarget?.lon, focusTarget?.hotspotCount]);

  const onMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const focusHotspot = useCallback((hotspot: Hotspot, minZoom = 11) => {
    setSelectedId(hotspot.id);
    const map = mapRef.current;
    if (!map) return;
    const zoom = Math.max(map.getZoom(), minZoom);
    map.flyTo([hotspot.lat, hotspot.lon], zoom, { duration: 0.9 });
  }, []);

  // When AI chat identifies an activeCluster during an investigation, smoothly fly the map to it
  const prevFocusSeqRef = useRef<number>(0);
  useEffect(() => {
    if (activeCluster && focusSeq > prevFocusSeqRef.current) {
      prevFocusSeqRef.current = focusSeq;
      setHotspots((prev) => {
        const filtered = prev.filter((h) => h.id !== activeCluster.id);
        return [activeCluster, ...filtered];
      });
      setActiveLayerIds((prev) => {
        const next = new Set(prev);
        next.add("hotspots");
        next.add("segmentation");
        return next;
      });
      setMobileView((v) => (v === "chat" ? "split" : v));
      focusHotspot(activeCluster, 11);
    }
  }, [activeCluster, focusSeq, focusHotspot]);

  const handleInvestigateHotspot = useCallback(
    (hotspot: Hotspot) => {
      setMobileView((v) => (v === "map" ? "split" : v));
      focusHotspot(hotspot, 11);
      sendMessage(
        `Saya beroperasi di ${hotspot.location} (${hotspot.district ?? "Indonesia"}). Berikan rencana alokasi sumber daya taktis di sekeliling perimeter luar (POS-1 s/d POS-4 & UDP-1) untuk memadamkan klaster ${hotspot.id} tanpa memasuki pusat api.`
      );
    },
    [focusHotspot, sendMessage]
  );

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

  const toggleSpatialLayer = (layerId: string) => {
    setActiveLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const preSimHotspotsRef = useRef<Hotspot[] | null>(null);
  const simStateRef = useRef<{ drones: Drone[]; hotspots: Hotspot[] }>({
    drones: [],
    hotspots: SAMPLE_HOTSPOTS,
  });

  useEffect(() => {
    simStateRef.current = { drones, hotspots };
  }, [drones, hotspots]);

  const toggleSimulation = (on: boolean) => {
    setSimulation(on);
    if (on) {
      const baseHotspots =
        hotspots.length > 0
          ? hotspots
          : preSimHotspotsRef.current ?? SAMPLE_HOTSPOTS;
      preSimHotspotsRef.current = baseHotspots;
      if (hotspots.length === 0) {
        setHotspots(baseHotspots);
      }
      const initialDrones = createDrones(rankHotspots(baseHotspots), 5);
      setDrones(initialDrones);
      setActiveDroneId(initialDrones[0]?.id ?? "DRN-01");
      setPriorityOverlayCollapsed(false);
    } else {
      setDrones([]);
      if (preSimHotspotsRef.current && preSimHotspotsRef.current.length > 0) {
        setHotspots(preSimHotspotsRef.current);
      }
    }
  };

  useEffect(() => {
    if (!simulation) return;
    const timer = setInterval(() => {
      const next = stepSimulation(simStateRef.current.drones, simStateRef.current.hotspots);
      simStateRef.current = next;
      setDrones(next.drones);
      setHotspots(next.hotspots);
      setSelectedId((prevSel) =>
        prevSel && !next.hotspots.some((h) => h.id === prevSel) ? null : prevSel
      );
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

  // Export functions
  const handleExportGeoJSON = () => {
    const features: Array<Record<string, unknown>> = [];
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
        },
        geometry: {
          type: "Point",
          coordinates: [h.longitude, h.latitude],
        },
      });
    });
    const payload = {
      type: "FeatureCollection",
      name: `SIGAP_Live_Spatial_Export_${focusTarget?.id ?? "ID"}`,
      generated_at: new Date().toISOString(),
      features,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Spatial_${focusTarget?.id ?? "ID"}_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportDecisionsJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      agent: "SIGAP Wildfire Response Orchestrator",
      active_cluster: focusTarget,
      execution_steps: currentSteps,
      decision_audit_log: decisionLogs,
      conversation: messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Investigation_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSessionPdf = (caseId?: string, lat?: number, lon?: number) => {
    const id = caseId || focusTarget?.id || "SIGAP-2026-LIVE-01";
    const url = getReportDownloadUrl(id, lat ?? focusTarget?.lat, lon ?? focusTarget?.lon);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Report_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPriorityCSV = () => {
    const headers = [
      "ID",
      "Lokasi",
      "Wilayah",
      "Koordinat",
      "Skor_MCDA",
      "Jumlah_Hotspot",
      "Karakteristik_Tanah",
      "Jarak_Permukiman_km",
      "dNBR",
    ];
    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = filteredPriorityHotspots.map((h) =>
      [
        h.id,
        h.location,
        h.district ?? "Indonesia",
        `${h.lat.toFixed(4)}, ${h.lon.toFixed(4)}`,
        Math.round(h.riskScore),
        h.hotspotCount ?? 1,
        h.soil,
        h.settlementKm,
        h.dnbrMean,
      ]
        .map(escapeCsv)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Priority_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportReportFormat = async (format: "pdf" | "geojson", report: LiveReportItem) => {
    const key = `${report.caseNumber}:${format}`;
    setExportingKey(key);
    try {
      if (format === "pdf") {
        handleDownloadSessionPdf(report.caseNumber, report.lat, report.lon);
      } else {
        const geojson = await fetchReportGeoJSON(report.caseNumber, report.lat, report.lon);
        if (!geojson) return;
        const blob = new Blob([JSON.stringify(geojson, null, 2)], {
          type: "application/geo+json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SIGAP_Spatial_${report.caseNumber}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportingKey(null);
    }
  };

  // Filtered priority list for the MCDA drawer
  const filteredPriorityHotspots = useMemo(() => {
    return ranked.filter((h) => {
      if (criteriaFilter === "critical") return h.riskScore >= 85;
      if (criteriaFilter === "peatland") return h.peatland;
      if (criteriaFilter === "settlement") return h.settlementKm <= 3.0;
      return true;
    });
  }, [ranked, criteriaFilter]);

  // Filtered reports for the Reports drawer
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = reportSearch.toLowerCase();
      const matchSearch =
        r.caseNumber.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.examiner.toLowerCase().includes(q);
      const matchStatus = reportStatusFilter === "all" || r.status === reportStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, reportSearch, reportStatusFilter]);

  const redHa = segmentation?.coverage_breakdown_ha.red_high_severity_ha ?? 34.4;
  const orangeHa = segmentation?.coverage_breakdown_ha.orange_moderate_severity_ha ?? 52.8;
  const yellowHa = segmentation?.coverage_breakdown_ha.yellow_low_severity_ha ?? 70.1;
  const totalHa = segmentation?.coverage_breakdown_ha.total_burned_area_ha ?? focusTarget?.areaHa ?? 157.3;
  const completedStepsCount = currentSteps.filter((s) => s.status === "completed").length;

  const toggleDrawer = (tab: BottomDrawerTab) => {
    setDrawerTab((prev) => (prev === tab ? "none" : tab));
  };

  return (
    <div className="flex h-dvh w-screen min-w-[300px] flex-col overflow-hidden bg-sigap-app text-slate-900">
      {/* COMPACT UNIFIED TOP HEADER BAR — Responsive down to 300px width */}
      <header className="relative z-[1001] flex h-auto shrink-0 flex-col gap-1.5 border-b border-slate-300 bg-sigap-panel px-2 py-1.5 shadow-xs sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3 sm:py-0">
        {/* Top Row (Mobile) / Left (Desktop): Logo + Search */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <SigapLogo size="mobile" className="sm:hidden" />
          <SigapLogo size="desktop" className="hidden sm:flex" />
          <LocationSearch
            hotspots={hotspots}
            onSelectHotspot={(h) => focusHotspot(h)}
            onSelectPlace={focusPlace}
            className="w-full min-w-0 max-w-none sm:max-w-[320px] xl:max-w-[380px]"
          />
          {isLiveFeed && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-900 md:inline-flex shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE FIRMS + STAC + DINOv3
            </span>
          )}
        </div>

        {/* Bottom Row (Mobile) / Right (Desktop): Mobile View Switcher + Panel Toggles + Simulation + Export */}
        <div className="flex items-center justify-between gap-1 sm:justify-end sm:gap-1.5 shrink-0">
          {/* Mobile Workspace Mode Switcher (< lg, optimized for 300x730) */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white/90 p-0.5 text-[10px] lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView("map")}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-mono font-semibold transition-colors",
                mobileView === "map"
                  ? "bg-sigap-cobalt text-white"
                  : "text-slate-700 hover:bg-slate-200/70"
              )}
              title="Tampilan Peta Penuh"
            >
              <MapIcon className="size-3" />
              <span>Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView("split")}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-mono font-semibold transition-colors",
                mobileView === "split"
                  ? "bg-sigap-cobalt text-white"
                  : "text-slate-700 hover:bg-slate-200/70"
              )}
              title="Tampilan Split Peta & AI Chat"
            >
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView("chat")}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-mono font-semibold transition-colors",
                mobileView === "chat"
                  ? "bg-sigap-cobalt text-white"
                  : "text-slate-700 hover:bg-slate-200/70"
              )}
              title="Tampilan Chat Investigasi AI Penuh"
            >
              <MessageSquare className="size-3" />
              <span>AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex items-center rounded-lg border border-slate-300 bg-white/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (mobileView === "chat") setMobileView("split");
                  toggleDrawer("priority");
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 font-mono text-[10px] sm:text-[11px] font-semibold transition-colors",
                  drawerTab === "priority"
                    ? "bg-sigap-cobalt text-white"
                    : "text-slate-700 hover:bg-slate-200/70"
                )}
                title="Buka/Tutup Matriks Prioritas MCDA"
              >
                <ShieldAlert className="size-3 sm:size-3.5" />
                <span className="hidden md:inline">Matriks Prioritas</span>
                <span className="rounded bg-black/10 px-1 text-[9px] sm:text-[10px]">{ranked.length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (mobileView === "chat") setMobileView("split");
                  toggleDrawer("reports");
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 font-mono text-[10px] sm:text-[11px] font-semibold transition-colors",
                  drawerTab === "reports"
                    ? "bg-sigap-cobalt text-white"
                    : "text-slate-700 hover:bg-slate-200/70"
                )}
                title="Buka/Tutup Laporan & Riwayat Kasus"
              >
                <FileText className="size-3 sm:size-3.5" />
                <span className="hidden md:inline">Laporan</span>
                <span className="rounded bg-black/10 px-1 text-[9px] sm:text-[10px]">{reports.length}</span>
              </button>
            </div>

            <SimulationToggle checked={simulation} onChange={toggleSimulation} />

            <button
              type="button"
              onClick={handleExportGeoJSON}
              title="Ekspor GeoJSON Layer Aktif"
              className="hidden cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 xl:flex"
            >
              <Download className="size-3.5 text-amber-700" />
              <span>GeoJSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SINGLE-VIEWPORT SPLIT WORKSPACE: MAP COLUMN (LEFT) + AI CHAT COLUMN (RIGHT) */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT/CENTER: INTERACTIVE MAP + COMPACT OVERLAYS + COLLAPSIBLE IN-VIEWPORT DRAWER */}
        <div
          className={cn(
            "relative min-h-0 flex-1 flex-col overflow-hidden",
            mobileView === "chat" ? "hidden lg:flex" : "flex"
          )}
        >
          {/* MAP CANVAS */}
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 z-0">
              <FireMap
                hotspots={visible}
                rankById={rankById}
                selectedId={selectedId}
                onSelect={onMapSelect}
                onInvestigate={handleInvestigateHotspot}
                onReady={onMapReady}
                drones={drones}
                activeDroneId={activeDroneId}
                onSelectDrone={setActiveDroneId}
                basemap={basemap}
                activeLayerIds={activeLayerIds}
                rawHotspots={rawHotspots}
                segmentation={segmentation}
                spatialContext={spatialContext}
              />
            </div>

            {/* TOP-LEFT MAP OVERLAY: Compact Severity Filter + Spatial Layer Toggles */}
            <div className="pointer-events-none absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-[900] flex max-w-[calc(100%-150px)] md:max-w-[calc(100%-265px)] flex-col gap-1.5">
              {/* Mobile Compact Toggle Button for Filter & Layer (< md) */}
              <button
                type="button"
                onClick={() => setMobileLayersOpen((v) => !v)}
                className="pointer-events-auto flex w-fit cursor-pointer items-center gap-1 rounded-lg border border-slate-300/90 bg-white/95 px-2 py-1 font-mono text-[10px] font-semibold text-slate-800 shadow-md backdrop-blur-md md:hidden"
              >
                <Layers className="size-3 text-amber-700" />
                <span>Filter & Layer ({activeLayerIds.size})</span>
                {mobileLayersOpen ? (
                  <ChevronUp className="size-3 text-slate-500" />
                ) : (
                  <ChevronDown className="size-3 text-slate-500" />
                )}
              </button>

              {/* Expanded Filter & Layer controls (always visible on md+, collapsible on mobile) */}
              <div
                className={cn(
                  "flex-col gap-1.5 w-[min(276px,calc(100vw-20px))] md:w-auto",
                  mobileLayersOpen ? "flex" : "hidden md:flex"
                )}
              >
                <SeverityLegend
                  hidden={hiddenSeverities}
                  onToggle={toggleSeverity}
                  className="pointer-events-auto w-fit"
                />

                {/* Compact Spatial Layer Chips */}
                <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-slate-300/80 bg-white/90 px-2.5 py-1.5 shadow-md backdrop-blur-md">
                  <span className="mr-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <Layers className="size-3 text-amber-700" />
                    Layer:
                  </span>
                  {SPATIAL_LAYERS.map((layer) => {
                    const active = activeLayerIds.has(layer.id);
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => toggleSpatialLayer(layer.id)}
                        title={layer.label}
                        className={cn(
                          "flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-all",
                          active
                            ? layer.colorClass
                            : "border-slate-200 bg-slate-50 text-slate-400 opacity-60 hover:opacity-90"
                        )}
                      >
                        {layer.icon}
                        <span>{layer.shortLabel}</span>
                        {active ? (
                          <Eye className="size-2.5 opacity-75" />
                        ) : (
                          <EyeOff className="size-2.5 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TOP-RIGHT MAP OVERLAY: Compact Collapsible Priority Hotspots & Drone Telemetry Card */}
            <div className="pointer-events-none absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-[900] flex items-start gap-1 sm:gap-1.5">
              <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} className="pointer-events-auto" />

              <aside
                className={cn(
                  "pointer-events-auto rounded-xl border border-slate-300/90 bg-sigap-panel/95 shadow-lg backdrop-blur-md transition-all",
                  priorityOverlayCollapsed
                    ? "w-auto px-2 py-1 md:w-[250px] xl:w-[270px] md:p-2.5"
                    : "w-[min(248px,calc(100vw-54px))] p-2 md:w-[250px] xl:w-[270px] md:p-2.5"
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <span className="md:hidden">Prioritas</span>
                    <span className="hidden md:inline">Ringkasan Cepat</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPriorityOverlayCollapsed((v) => !v)}
                    className="flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-mono text-slate-600 hover:bg-black/5"
                  >
                    <span>{priorityOverlayCollapsed ? "Buka" : "Ciutkan"}</span>
                    {priorityOverlayCollapsed ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronUp className="size-3" />
                    )}
                  </button>
                </div>

                {!priorityOverlayCollapsed && (
                  <div className="mt-1.5 max-h-[calc(100dvh-250px)] space-y-2.5 overflow-y-auto pr-0.5">
                    <PriorityList
                      hotspots={priorities}
                      selectedId={selectedId}
                      onSelect={(h) => focusHotspot(h)}
                      onInvestigate={handleInvestigateHotspot}
                    />
                    {simulation && (
                      <DroneStatus
                        drones={drones}
                        activeDroneId={activeDroneId}
                        onSelectDrone={setActiveDroneId}
                        selectedHotspot={selectedHotspot}
                        onAssign={assignDrone}
                        onRecall={recallDrone}
                      />
                    )}
                  </div>
                )}
              </aside>
            </div>

            {/* BOTTOM-LEFT MAP OVERLAY: Basemap Switcher + DINOv3 BurnSeg Telemetry Pill */}
            <div className="pointer-events-none absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-[900] flex flex-wrap items-center gap-1.5 max-w-[calc(100vw-16px)]">
              {/* Basemap Switcher */}
              <div className="pointer-events-auto flex items-center rounded-lg border border-slate-300/80 bg-white/90 p-0.5 text-[10px] shadow-md backdrop-blur-md">
                {(
                  [
                    { id: "physical", label: "Fisik" },
                    { id: "satellite", label: "Satelit" },
                    { id: "roadmap", label: "Peta" },
                    { id: "terrain", label: "Medan" },
                  ] as const
                ).map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => setBasemap(bm.id)}
                    className={cn(
                      "cursor-pointer rounded px-1.5 sm:px-2 py-0.5 font-mono font-semibold transition-colors",
                      basemap === bm.id
                        ? "bg-sigap-cobalt text-white"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>

              {/* DINOv3 Compact Summary Pill */}
              <div className="pointer-events-auto hidden items-center gap-2 rounded-lg border border-slate-300/80 bg-white/90 px-2.5 py-1 text-[10px] font-mono shadow-md backdrop-blur-md sm:flex">
                <span className="font-bold text-slate-800">
                  DINOv3 {focusTarget?.id}: {totalHa} Ha
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="size-2 rounded-full bg-red-600" />
                  {redHa}Ha
                </span>
                <span className="flex items-center gap-1 text-orange-700">
                  <span className="size-2 rounded-full bg-orange-500" />
                  {orangeHa}Ha
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="size-2 rounded-full bg-yellow-400" />
                  {yellowHa}Ha
                </span>
                {spatialContext?.settlements?.[0] && (
                  <span className="border-l border-slate-300 pl-2 text-cyan-800">
                    🏘️ {spatialContext.settlements[0].name} ({spatialContext.settlements[0].distance_km}km)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE BOTTOM DRAWER (PRIORITY MATRIX / REPORTS) */}
          {drawerTab !== "none" && (
            <section className="relative z-[950] flex h-[210px] sm:h-[240px] xl:h-[260px] shrink-0 flex-col border-t border-slate-300 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
              {/* Drawer Header Bar */}
              <div className="flex h-auto min-h-9 shrink-0 flex-wrap items-center justify-between gap-1 border-b border-slate-200 bg-slate-100 px-2 sm:px-3 py-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                  {drawerTab === "priority" && (
                    <>
                      <ShieldCheck className="size-3.5 sm:size-4 text-amber-700 shrink-0" />
                      <h3 className="font-mono text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                        Matriks Prioritas (MCDA)
                      </h3>
                      <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] sm:text-[11px]">
                        <Filter className="size-3 text-slate-500 shrink-0" />
                        <select
                          value={criteriaFilter}
                          onChange={(e) => setCriteriaFilter(e.target.value as CriteriaFilter)}
                          className="bg-transparent font-medium text-slate-800 focus:outline-none"
                        >
                          <option value="all">Semua ({ranked.length})</option>
                          <option value="critical">Kritis ≥ 85</option>
                          <option value="peatland">Lahan Gambut</option>
                          <option value="settlement">Dekat Permukiman ≤ 3km</option>
                        </select>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownloadPriorityCSV}
                        className="h-6 px-2 text-[10px] gap-1"
                      >
                        <ArrowDownToLine className="size-3" />
                        <span>CSV</span>
                      </Button>
                    </>
                  )}

                  {drawerTab === "reports" && (
                    <>
                      <FileText className="size-3.5 sm:size-4 text-amber-700 shrink-0" />
                      <h3 className="font-mono text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                        Laporan & Riwayat Kasus
                      </h3>
                      <div className="relative w-32 sm:w-48">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                        <input
                          type="text"
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                          placeholder="Cari kasus / wilayah..."
                          className="h-6 w-full rounded-md border border-slate-300 bg-white pl-6 pr-2 text-[10px] sm:text-[11px] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <select
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value)}
                        className="h-6 rounded-md border border-slate-300 bg-white px-1.5 text-[10px] sm:text-[11px] font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="all">Semua</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Draft">Draft</option>
                        <option value="Ditinjau">Ditinjau</option>
                      </select>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerTab("none")}
                  className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 shrink-0"
                >
                  <span className="hidden sm:inline">Tutup</span>
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-2.5">
                {/* TAB 1: PRIORITY MATRIX */}
                {drawerTab === "priority" && (
                  <table className="w-full min-w-[540px] text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="py-1.5 px-2 w-8"></th>
                        <th className="py-1.5 px-2">Klaster & Wilayah</th>
                        <th className="py-1.5 px-2">Faktor Risiko & Lahan</th>
                        <th className="py-1.5 px-2 text-center">Skor MCDA</th>
                        <th className="py-1.5 px-2">Indikator</th>
                        <th className="py-1.5 px-2 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPriorityHotspots.map((h, idx) => {
                        const isExp = expandedPrioId === h.id;
                        const score = Math.round(h.riskScore);
                        return (
                          <React.Fragment key={h.id}>
                            <tr
                              onClick={() => setExpandedPrioId(isExp ? null : h.id)}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50",
                                selectedId === h.id && "bg-amber-500/5"
                              )}
                            >
                              <td className="py-1.5 px-2 text-center">
                                {isExp ? (
                                  <ChevronUp className="size-3.5 text-amber-700 inline" />
                                ) : (
                                  <ChevronDown className="size-3.5 text-slate-400 inline" />
                                )}
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="font-semibold text-slate-900">
                                  #{idx + 1} {h.id} — {h.location}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {h.district ?? "Indonesia"} ({h.lat.toFixed(3)}°, {h.lon.toFixed(3)}°)
                                </div>
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="font-medium text-slate-800">{h.soil}</div>
                                <div className="text-[10px] text-slate-500">{h.fireType}</div>
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <span
                                  className={cn(
                                    "inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold",
                                    score >= 85
                                      ? "border-rose-500/40 bg-rose-500/15 text-rose-800"
                                      : "border-amber-500/40 bg-amber-500/15 text-amber-800"
                                  )}
                                >
                                  {score}/100
                                </span>
                              </td>
                              <td className="py-1.5 px-2">
                                <div>
                                  {h.hotspotCount ?? 1} titik • {h.areaHa} Ha • dNBR {h.dnbrMean}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {h.settlementKm} km ke desa • ETA {h.etaMin} mnt
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-right">
                                <div
                                  className="inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => focusHotspot(h, 8)}
                                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    Peta
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadSessionPdf(h.id, h.lat, h.lon)}
                                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInvestigateHotspot(h)}
                                    className="flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-slate-950 hover:bg-amber-400"
                                  >
                                    <Bot className="size-3" />
                                    <span>Investigasi AI</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExp && (
                              <tr className="bg-slate-50">
                                <td colSpan={6} className="p-2.5">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-lg border border-amber-500/30 bg-white p-2.5 text-[11px]">
                                    <div>
                                      <div className="font-semibold text-amber-800 flex items-center gap-1">
                                        <HelpCircle className="size-3" />
                                        <span>Why This Area? (Pertimbangan AI)</span>
                                      </div>
                                      <p className="mt-0.5 text-[10px] text-slate-600 leading-normal">
                                        Deteksi {h.satellite} ({h.lastCondition}) pada {h.soil}. Skor risiko MCDA {h.riskScore}/100.
                                      </p>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-emerald-800 flex items-center gap-1">
                                        <Trees className="size-3" />
                                        <span>Risiko Gambut & Permukiman</span>
                                      </div>
                                      <p className="mt-0.5 text-[10px] text-slate-600 leading-normal">
                                        Jarak permukiman {h.settlementKm} km; tipe kebakaran {h.fireType.toLowerCase()} dengan luas ~{h.areaHa} Ha.
                                      </p>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-cyan-800 flex items-center gap-1">
                                        <CheckCircle2 className="size-3" />
                                        <span>Rekomendasi Operasional</span>
                                      </div>
                                      <p className="mt-0.5 text-[10px] text-slate-600 leading-normal">
                                        Kerahkan regu darat terdekat ({h.distanceKm} km, ETA {h.etaMin} mnt) & sekat kanal/water bombing.
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* TAB 2: REPORTS & CASE HISTORY */}
                {drawerTab === "reports" && (
                  <table className="w-full min-w-[520px] text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="py-1.5 px-2">ID Kasus</th>
                        <th className="py-1.5 px-2">Wilayah & Ringkasan</th>
                        <th className="py-1.5 px-2">Tanggal</th>
                        <th className="py-1.5 px-2">Pemeriksa</th>
                        <th className="py-1.5 px-2">Status</th>
                        <th className="py-1.5 px-2 text-right">Ekspor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredReports.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 font-mono font-bold text-amber-700">
                            {r.caseNumber}
                          </td>
                          <td className="py-1.5 px-2 max-w-xs">
                            <div className="font-semibold text-slate-900">{r.region}</div>
                            <div className="truncate text-[10px] text-slate-500">{r.summary}</div>
                          </td>
                          <td className="py-1.5 px-2 whitespace-nowrap text-slate-600">{r.date}</td>
                          <td className="py-1.5 px-2 text-slate-700">
                            <div>{r.examiner}</div>
                            {r.totalBurnedAreaHa && (
                              <span className="text-[10px] text-amber-700">
                                {r.totalBurnedAreaHa} Ha • Skor {r.priorityScore}/100
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              {r.lat !== undefined && r.lon !== undefined && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    mapRef.current?.flyTo([r.lat!, r.lon!], 9, { duration: 0.8 })
                                  }
                                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  Peta
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={exportingKey === `${r.caseNumber}:pdf`}
                                onClick={() => handleExportReportFormat("pdf", r)}
                                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-slate-100"
                              >
                                PDF
                              </button>
                              <button
                                type="button"
                                disabled={exportingKey === `${r.caseNumber}:geojson`}
                                onClick={() => handleExportReportFormat("geojson", r)}
                                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-slate-100"
                              >
                                GeoJSON
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: ALWAYS-VISIBLE AI INVESTIGATION CHAT & AGENT EXECUTION TRACE */}
        <aside
          className={cn(
            "w-full lg:w-[400px] xl:w-[440px] 2xl:w-[480px] shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-slate-300 bg-white overflow-hidden",
            mobileView === "map"
              ? "hidden lg:flex lg:h-full"
              : mobileView === "chat"
                ? "flex flex-1 lg:h-full"
                : "flex h-[45dvh] lg:h-full"
          )}
        >
          {/* Compact Chat Header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700">
                <Sparkles className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate font-mono text-xs font-bold text-slate-900">
                    AI Investigation Chat
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    ADK Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleExportDecisionsJson}
                title="Ekspor Log Keputusan Agen (JSON)"
                className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-mono text-slate-700 hover:bg-slate-100"
              >
                <FileCode className="size-3 text-cyan-700" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSessionPdf()}
                title="Unduh Laporan Sesi Investigasi (PDF)"
                className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-mono text-slate-700 hover:bg-slate-100"
              >
                <DownloadCloud className="size-3 text-rose-700" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={clearMessages}
                title="Reset Percakapan"
                className="flex cursor-pointer items-center justify-center rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>

          {/* Collapsible Agent Execution Plan & Decision Audit Bar */}
          <div className="shrink-0 border-b border-slate-200 bg-slate-100/80">
            <button
              type="button"
              onClick={() => setShowAgentTrace((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[11px] hover:bg-slate-200/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="size-3.5 text-amber-700 shrink-0" />
                <span className="font-mono font-semibold text-slate-800 truncate">
                  Alur Eksekusi & Audit Agen
                </span>
                <span className="rounded bg-amber-500/15 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-amber-800">
                  {completedStepsCount}/{currentSteps.length || 5} Langkah
                </span>
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-cyan-800">
                  {decisionLogs.length} Log
                </span>
              </div>
              {showAgentTrace ? (
                <ChevronUp className="size-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="size-3.5 text-slate-500 shrink-0" />
              )}
            </button>

            {showAgentTrace && (
              <div className="max-h-56 overflow-y-auto border-t border-slate-200 bg-white p-2.5 space-y-2">
                <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                  <button
                    type="button"
                    onClick={() => setTraceSubTab("steps")}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-semibold",
                      traceSubTab === "steps"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Alur Kerja ({currentSteps.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTraceSubTab("logs")}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-semibold",
                      traceSubTab === "logs"
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Decision Audit Log ({decisionLogs.length})
                  </button>
                </div>

                {traceSubTab === "steps" ? (
                  <div className="space-y-1.5">
                    {currentSteps.map((step) => {
                      const isCompleted = step.status === "completed";
                      const isRunning = step.status === "running";
                      return (
                        <div
                          key={step.id}
                          className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px]"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : isRunning ? (
                            <Loader2 className="size-3.5 text-amber-600 animate-spin shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-800 truncate">
                                {step.title}
                              </span>
                              <span className="font-mono text-[9px] uppercase text-slate-500 shrink-0">
                                {step.status}
                              </span>
                            </div>
                            {step.description && (
                              <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {decisionLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-mono text-cyan-800 font-semibold">
                          <span>{log.step}</span>
                          <span className="text-slate-400">{log.timestamp}</span>
                        </div>
                        <div className="font-medium text-slate-800">{log.decision}</div>
                        <div className="text-slate-600 italic border-l-2 border-amber-500/50 pl-1.5">
                          {log.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Chat Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-3 py-2 space-y-1.5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-white px-3 py-2 text-xs text-amber-800 shadow-2xs w-fit">
                <Loader2 className="size-3.5 animate-spin shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-800 text-[11px]">
                    Agen mengevaluasi telemetri satelit...
                  </span>
                  <span className="text-[10px] text-slate-500">
                    FIRMS NRT • AWS STAC Sentinel-2 • DINOv3 BurnSeg
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact Chat Input Bar */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-2">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </aside>
      </div>
    </div>
  );
}
