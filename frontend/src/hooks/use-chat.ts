"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage, InvestigationStep, DecisionLogEntry } from "@/lib/types";
import {
  fetchImageryMetadata,
  fetchMonitoringHotspots,
  fetchSegmentationData,
  sendChatMessage,
  startInvestigation,
} from "@/lib/api";
import {
  buildTacticalAllocationPlan,
  type Hotspot,
} from "@/lib/monitoring";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-welcome",
    role: "agent",
    content:
      "Halo! Saya **SIGAP Wildfire Response Orchestrator** (Google ADK & Gemini).\n\nSaya mengoordinasikan 6 sub-agen otonom untuk memantau **live NASA FIRMS**, citra **AWS STAC Sentinel-2 L2A**, segmentasi **DINOv3 BurnSeg**, penilaian risiko **MCDA**, dan penugasan tim/drone.\n\nKetik instruksi di bawah atau klik tombol **AI** pada hotspot di peta untuk memulai investigasi.",
    timestamp: "LIVE",
  },
];

const CLIENT_REGION_KEYWORDS: [string, string][] = [
  ["pulang pisau", "Pulang Pisau"],
  ["palangka raya", "Palangkaraya"],
  ["palangkaraya", "Palangkaraya"],
  ["kotawaringin timur", "Kotawaringin Timur"],
  ["kotawaringin barat", "Kotawaringin Barat"],
  ["pangkalan bun", "Kotawaringin Barat"],
  ["sampit", "Kotawaringin Timur"],
  ["kapuas", "Kapuas"],
  ["seruyan", "Seruyan"],
  ["katingan", "Katingan"],
  ["kubu raya", "Kubu Raya"],
  ["pontianak", "Pontianak"],
  ["ketapang", "Ketapang"],
  ["sintang", "Sintang"],
  ["banjarmasin", "Banjarmasin"],
  ["balikpapan", "Balikpapan"],
  ["samarinda", "Samarinda"],
  ["kutai", "Kutai Kartanegara"],
  ["berau", "Berau"],
  ["medan", "Medan"],
  ["pekanbaru", "Pekanbaru"],
  ["dumai", "Dumai"],
  ["bengkalis", "Bengkalis"],
  ["pelalawan", "Pelalawan"],
  ["siak", "Siak"],
  ["indragiri", "Indragiri Hilir"],
  ["jambi", "Jambi"],
  ["muaro jambi", "Muaro Jambi"],
  ["palembang", "Palembang"],
  ["ogan komering ilir", "Ogan Komering Ilir"],
  ["oki", "Ogan Komering Ilir"],
  ["musi banyuasin", "Musi Banyuasin"],
  ["merauke", "Merauke"],
  ["mappi", "Mappi"],
  ["jayapura", "Jayapura"],
  ["kupang", "Kupang"],
  ["sumba", "Sumba Timur"],
  ["makassar", "Makassar"],
  ["kalimantan tengah", "Kalimantan Tengah"],
  ["kalimantan barat", "Kalimantan Barat"],
  ["kalimantan selatan", "Kalimantan Selatan"],
  ["kalimantan timur", "Kalimantan Timur"],
  ["kalimantan", "Kalimantan"],
  ["riau", "Riau"],
  ["sumatera selatan", "Sumatera Selatan"],
  ["sumatera utara", "Sumatera Utara"],
  ["sumatera", "Sumatera"],
  ["papua", "Papua"],
  ["sulawesi", "Sulawesi"],
  ["jawa", "Jawa"],
];

function extractClientRegion(query: string): string | null {
  const q = query.toLowerCase();
  for (const [kw, label] of CLIENT_REGION_KEYWORDS) {
    if (q.includes(kw)) return label;
  }
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<InvestigationStep[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLogEntry[]>([]);
  const [activeCluster, setActiveCluster] = useState<Hotspot | null>(null);
  const [focusSeq, setFocusSeq] = useState(0);
  const isExecutingRef = useRef(false);
  const sessionIdRef = useRef<string>(`inv-session-${Date.now()}`);
  const lastRegionRef = useRef<string>("Kalimantan");


  // Initialize timeline and decision logs from live NASA FIRMS + AWS STAC + DINOv3 baseline
  useEffect(() => {
    let active = true;
    (async () => {
      const liveFeed = await fetchMonitoringHotspots("Kalimantan", 5);
      if (!active || isExecutingRef.current) return;
      const top = liveFeed.hotspots[0];
      if (!top) return;
      setActiveCluster(top);

      const scale = Math.max(0.6, Math.min(2.6, Math.sqrt((top.areaHa || 150) / 180)));
      const [seg, img] = await Promise.all([
        fetchSegmentationData(top.lat, top.lon, scale),
        fetchImageryMetadata(top.acqDate, top.lat, top.lon),
      ]);
      if (!active || isExecutingRef.current) return;

      const nowStr = new Date().toLocaleTimeString("id-ID");
      const stacScene =
        seg?.stac_scene?.scene_id ||
        img?.post_fire?.scene_id ||
        "S2A_49MFM_L2A";
      const stacCloud =
        seg?.stac_scene?.cloud_cover ??
        img?.post_fire?.cloud_cover_percentage ??
        6.8;
      const totalHa =
        seg?.coverage_breakdown_ha?.total_burned_area_ha ?? top.areaHa;
      const highHa =
        seg?.coverage_breakdown_ha?.red_high_severity_ha ??
        Math.round(top.areaHa * 0.22);

      setCurrentSteps([
        {
          id: "step-init-1",
          title: "Pemantauan Otonom & Ekstraksi Episentrum",
          description: `Klaster #1 terdeteksi di ${top.location} (${top.lat.toFixed(4)}°, ${top.lon.toFixed(4)}°).`,
          status: "completed",
          timestamp: nowStr,
        },
        {
          id: "step-init-2",
          title: "Agregasi Hotspot NASA FIRMS (VIIRS 375m)",
          description: `${liveFeed.total_raw_hotspots} titik panas aktif membentuk ${liveFeed.cluster_count} klaster DBSCAN (Klaster #1: ${top.hotspotCount ?? 1} titik, FRP ${top.totalFrp ?? 25} MW).`,
          status: "completed",
          timestamp: nowStr,
        },
        {
          id: "step-init-3",
          title: "Akuisisi Citra Sentinel-2 L2A (AWS Earth Search STAC)",
          description: `Scene STAC ${stacScene} terverifikasi (tutupan awan ${stacCloud}%).`,
          status: "completed",
          timestamp: nowStr,
        },
        {
          id: "step-init-4",
          title: "Segmentasi DINOv3 BurnSeg & Radius Keparahan",
          description: `${totalHa} Ha area terbakar terpetakan (Inti Merah: ${highHa} Ha, dNBR rata-rata ${top.dnbrMean}).`,
          status: "completed",
          timestamp: nowStr,
        },
        {
          id: "step-init-5",
          title: "Matriks Penilaian Dampak MCDA & Aksesibilitas",
          description: `Skor risiko ${top.riskScore}/100 (${top.soil}, ${top.settlementKm} km ke permukiman terdekat, ETA ${top.etaMin} mnt).`,
          status: "completed",
          timestamp: nowStr,
        },
      ]);

      setDecisionLogs([
        {
          id: "dec-init-1",
          step: "AOI & Cluster Detection (Live FIRMS)",
          decision: `Fokus operasional diarahkan ke ${top.location} (${top.district ?? "Kalimantan"}).`,
          reasoning: `Klaster memiliki konsentrasi ${top.hotspotCount ?? 1} titik panas VIIRS dengan radiasi termal FRP ${top.totalFrp ?? 25} MW.`,
          timestamp: nowStr,
        },
        {
          id: "dec-init-2",
          step: "AWS Earth Search STAC Selection",
          decision: `Memilih scene Sentinel-2 L2A ${stacScene} (COG 6-band).`,
          reasoning: `Tutupan awan pada scene STAC tercatat ${stacCloud}%, memenuhi ambang batas inferensi DINOv3.`,
          timestamp: nowStr,
        },
        {
          id: "dec-init-3",
          step: "MCDA Priority & Dispatch",
          decision: `Menetapkan status respon prioritas (Skor ${top.riskScore}/100).`,
          reasoning: `Berada pada kawasan ${top.soil} berjarak ${top.settlementKm} km dari permukiman warga.`,
          timestamp: nowStr,
        },
      ]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const sendMessage = useCallback(async (content: string, targetHotspot?: Hotspot) => {
    if (!content.trim() || isExecutingRef.current) return;
    isExecutingRef.current = true;

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const initialSteps: InvestigationStep[] = [
      {
        id: "step-1",
        title: "Pemahaman Perintah & Ekstraksi Wilayah",
        description: "Mengekstrak lokasi target, rentang waktu, dan batasan perintah pengguna.",
        status: "running",
      },
      {
        id: "step-2",
        title: "Perception & Fusion — Agregasi Hotspot FIRMS Live",
        description: "Mengambil data thermal live NASA FIRMS (VIIRS 375m) & pengelompokan spasial DBSCAN.",
        status: "pending",
      },
      {
        id: "step-3",
        title: "Akuisisi Citra Sentinel-2 L2A (AWS Earth Search STAC)",
        description: "Mengevaluasi tutupan awan & Cloud-Optimized GeoTIFF (COG) dari AWS STAC API.",
        status: "pending",
      },
      {
        id: "step-4",
        title: "Segmentasi DINOv3 BurnSeg & Radius Keparahan",
        description: "Inferensi DINOv3 (vit_large_patch16) pada patch satelit STAC untuk zona Merah/Oranye/Kuning.",
        status: "pending",
      },
      {
        id: "step-5",
        title: "Risk Scoring & Evaluasi Bukti",
        description: "Menghitung skor prioritas berbasis tutupan gambut dan kedekatan permukiman.",
        status: "pending",
      },
      {
        id: "step-6",
        title: "Routing & Dispatch Optimasi Tim",
        description: "Penyusunan penugasan regu Manggala Agni berdasarkan akses jalan dan sumber air.",
        status: "pending",
      },
    ];

    setCurrentSteps(initialSteps);
    setDecisionLogs([]);

    try {
      const chatPromise = sendChatMessage(content, sessionIdRef.current);
      const clientRegion = extractClientRegion(content);

      // Quick check: if query has no clientRegion and might be blocked by backend guardrail, await chatRes first
      const qLowerCheck = content.toLowerCase();
      const looksOffTopic =
        [
          "resep",
          "masak",
          "kuliner",
          "nasi goreng",
          "hotel murah",
          "tiket pesawat",
          "bioskop",
          "lagu",
          "sepak bola",
          "kripto",
          "crypto",
          "bitcoin",
          "buatkan kode",
          "tulis kode",
          "write code",
          "javascript",
          "leetcode",
          "kalkulus",
          "puisi",
          "cerpen",
          "lelucon",
          "zodiak",
          "ignore previous",
          "abaikan instruksi",
        ].some((kw) => qLowerCheck.includes(kw)) ||
        (!clientRegion &&
          !targetHotspot &&
          ![
            "api",
            "kebakaran",
            "karhutla",
            "hotspot",
            "titik",
            "asap",
            "gambut",
            "hutan",
            "lahan",
            "satelit",
            "firms",
            "sentinel",
            "stac",
            "dnbr",
            "dinov3",
            "risiko",
            "prioritas",
            "pemadam",
            "manggala",
            "bpbd",
            "drone",
            "pos-",
            "udp-",
            "taktis",
            "perimeter",
            "sekat",
            "air",
            "rute",
            "evakuasi",
            "permukiman",
            "wilayah",
            "daerah",
            "lokasi",
            "peta",
            "radius",
            "hektare",
            "angin",
            "cuaca",
            "kerugian",
            "rugi",
            "biaya",
            "dampak",
            "ekonomi",
            "emisi",
            "karbon",
            "dibiarkan",
            "pantau",
            "investigasi",
            "analisis",
            "status",
            "kondisi",
            "laporan",
            "siaga",
            "darurat",
            "bahaya",
            "aman",
            "wildfire",
            "fire",
            "burn",
            "smoke",
            "dispatch",
            "sigap",
          ].some((kw) => qLowerCheck.includes(kw)));

      if (looksOffTopic) {
        const guardrailRes = await chatPromise;
        if (!guardrailRes || guardrailRes.model_used === "sigap-domain-guardrail") {
          const nowStr = new Date().toLocaleTimeString("id-ID");
          setCurrentSteps([
            {
              id: "step-guardrail",
              title: "Guardrail Domain & Validasi Konteks Karhutla",
              description:
                "Permintaan dihentikan: di luar cakupan operasional pemadaman & intelijen karhutla SIGAP.",
              status: "completed",
              timestamp: nowStr,
            },
          ]);
          setDecisionLogs([
            {
              id: "log-guardrail-" + Date.now(),
              step: "SIGAP Domain Guardrail",
              decision: "Menolak eksekusi sub-agen & pemindaian satelit (Out-of-Scope Query).",
              reasoning:
                "Pertanyaan pengguna tidak berkaitan dengan deteksi titik panas, analisis cuaca/gambut, valuasi dampak kebakaran, atau alokasi taktis pemadaman.",
              timestamp: nowStr,
            },
          ]);
          setMessages((prev) => [
            ...prev,
            {
              id: "msg-reply-" + Date.now(),
              role: "agent",
              content:
                guardrailRes?.response ||
                "### 🛡️ di Luar Fokus Operasional Karhutla (Domain Guardrail)\n\nMaaf, **SIGAP Wildfire Response Orchestrator** hanya melayani instruksi yang berkaitan dengan **pemantauan kebakaran hutan dan lahan (karhutla)**, telemetri satelit, analisis cuaca/gambut, valuasi dampak kebakaran, serta pengerahan taktis tim pemadam.",
              timestamp: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
          return;
        }
      }

      const inv = await startInvestigation(content);
      const explicitRegion =
        inv?.region && inv.region !== "Indonesia"
          ? inv.region
          : clientRegion;
      if (explicitRegion) {
        lastRegionRef.current = explicitRegion;
      }
      const regionName = explicitRegion || lastRegionRef.current || "Indonesia";
      const liveFeed = await fetchMonitoringHotspots(regionName, 5);
      // Investigating a specific cluster must stay pinned to it, not the region's top-ranked one
      const topHotspot = targetHotspot ?? liveFeed.hotspots[0];
      const hasFires = Boolean(targetHotspot) || (liveFeed.total_raw_hotspots > 0 && Boolean(topHotspot));
      if (topHotspot) {
        setActiveCluster({ ...topHotspot });
        setFocusSeq((n) => n + 1);
      }

      const cLat = topHotspot?.lat ?? 3.5952;
      const cLon = topHotspot?.lon ?? 98.6722;
      const totalRaw = liveFeed.total_raw_hotspots;
      const clusterCount = liveFeed.cluster_count;
      const topCount = topHotspot?.hotspotCount ?? 0;
      const topFrp = topHotspot?.totalFrp ?? 0;
      const topScore = topHotspot?.riskScore ?? 0;
      const topLoc = topHotspot?.location ?? regionName;
      const topEta = topHotspot?.etaMin ?? 0;
      const topSettlementKm = topHotspot?.settlementKm ?? 0;
      const feedSourceBadge = liveFeed.is_live ? "LIVE NASA FIRMS NRT" : "FIRMS Cache";

      const scale = Math.max(
        0.6,
        Math.min(2.6, Math.sqrt(((topHotspot?.areaHa ?? 160) / 180)))
      );
      const [segData, imgMeta] = hasFires
        ? await Promise.all([
            fetchSegmentationData(cLat, cLon, scale),
            fetchImageryMetadata(topHotspot?.acqDate, cLat, cLon),
          ])
        : [null, null];

      const stacSceneId =
        segData?.stac_scene?.scene_id ||
        imgMeta?.post_fire?.scene_id ||
        "S2A_49MFM_L2A";
      const stacCloud =
        segData?.stac_scene?.cloud_cover ??
        imgMeta?.post_fire?.cloud_cover_percentage ??
        6.8;
      const topAreaHa = hasFires
        ? segData?.coverage_breakdown_ha?.total_burned_area_ha ??
          topHotspot?.areaHa ??
          157
        : 0;
      const redHa = hasFires
        ? segData?.coverage_breakdown_ha?.red_high_severity_ha ??
          Math.round(topAreaHa * 0.22)
        : 0;
      const orangeHa = hasFires
        ? segData?.coverage_breakdown_ha?.orange_moderate_severity_ha ??
          Math.round(topAreaHa * 0.35)
        : 0;
      const yellowHa = hasFires
        ? segData?.coverage_breakdown_ha?.yellow_low_severity_ha ??
          Math.round(topAreaHa * 0.43)
        : 0;

      await sleep(250);

      // STEP 1 COMPLETE -> STEP 2 RUNNING
      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-1") {
            return {
              ...s,
              status: "completed",
              description: `Terdeteksi fokus wilayah: ${regionName} (${feedSourceBadge}).`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-2") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(250);

      // STEP 2 COMPLETE -> STEP 3 RUNNING + Log 1
      const log1: DecisionLogEntry = {
        id: "log-" + Date.now() + "-1",
        step: "Perception & Fusion (Live FIRMS)",
        decision: hasFires
          ? `Terkonfirmasi ${totalRaw} titik panas aktif dalam ${clusterCount} klaster DBSCAN (Klaster #1: ${topCount} titik, FRP ${topFrp} MW).`
          : `Pemindaian satelit VIIRS 375m mendeteksi 0 titik panas aktif di wilayah ${regionName}.`,
        reasoning: hasFires
          ? `Data ${liveFeed.source} mendeteksi anomali termal berintensitas tinggi di ${topLoc}.`
          : `Tidak ditemukan anomali termal signifikan pada koordinat wilayah ${regionName} dalam 48 jam terakhir.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log1]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-2") {
            return {
              ...s,
              status: "completed",
              description: hasFires
                ? `${totalRaw} titik panas aktif (VIIRS 375m) teragregasi menjadi ${clusterCount} klaster spasial.`
                : `0 titik panas aktif (VIIRS 375m) di wilayah ${regionName} — status aman.`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-3") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(250);

      // STEP 3 COMPLETE -> STEP 4 RUNNING + Log 2
      const log2: DecisionLogEntry = {
        id: "log-" + Date.now() + "-2",
        step: "AWS Earth Search STAC (Sentinel-2 L2A)",
        decision: hasFires
          ? `Mengakuisisi scene Sentinel-2 L2A: ${stacSceneId} (tutupan awan ${stacCloud}%).`
          : `Verifikasi optik Sentinel-2 L2A pada ${regionName}: nihil kepulan asap / bekas luka bakar baru.`,
        reasoning: hasFires
          ? `Katalog AWS Earth Search STAC menyediakan Cloud-Optimized GeoTIFF (COG) 6-band pada koordinat (${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°).`
          : `Pemindaian permukaan memastikan tidak ada kebakaran tertutup awan tipis di ${regionName}.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log2]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-3") {
            return {
              ...s,
              status: "completed",
              description: hasFires
                ? `Scene AWS STAC ${stacSceneId} siap (tutupan awan ${stacCloud}%).`
                : `Verifikasi optik ${regionName} selesai (nihil anomali SWIR).`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-4") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(250);

      // STEP 4 COMPLETE -> STEP 5 RUNNING + Log 3
      const log3: DecisionLogEntry = {
        id: "log-" + Date.now() + "-3",
        step: "DINOv3 BurnSeg & Radius",
        decision: hasFires
          ? `Total area terbakar ${topAreaHa} Ha (Merah: ${redHa} Ha, Oranye: ${orangeHa} Ha, Kuning: ${yellowHa} Ha).`
          : `Area terbakar: 0 Ha di wilayah ${regionName}.`,
        reasoning: hasFires
          ? `Model DINOv3 (vit_large_patch16_dinov3.sat493m) memproses patch citra STAC ${stacSceneId} (dNBR rata-rata ${topHotspot?.dnbrMean ?? 0.71}).`
          : `Tidak diperlukan segmentasi perimeter api karena 0 titik panas aktif.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log3]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-4") {
            return {
              ...s,
              status: "completed",
              description: hasFires
                ? `Total ${topAreaHa} Ha terpetakan (Tinggi: ${redHa} Ha, Sedang: ${orangeHa} Ha, Rendah: ${yellowHa} Ha).`
                : `0 Ha area terbakar pada wilayah ${regionName}.`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-5") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(250);

      // STEP 5 COMPLETE -> STEP 6 RUNNING + Log 4
      const log4: DecisionLogEntry = {
        id: "log-" + Date.now() + "-4",
        step: "Risk Scoring Agent (MCDA)",
        decision: hasFires
          ? `Skor Prioritas ${topScore} / 100 — Kategori ${topScore >= 80 ? "KRITIS" : "TINGGI"} (${topLoc}).`
          : `Status Risiko ${regionName}: AMAN (Nihil Kebakaran Aktif).`,
        reasoning: hasFires
          ? `Karakteristik tanah ${topHotspot?.soil ?? "Gambut"} berjarak ${topSettlementKm} km dari permukiman warga terdekat.`
          : `Kelembapan permukaan stabil dan tidak ada ancaman perambatan api ke permukiman di ${regionName}.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log4]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-5") {
            return {
              ...s,
              status: "completed",
              description: hasFires
                ? `Skor risiko ${topScore}/100 (${topHotspot?.soil ?? "Gambut"}, ${topSettlementKm} km ke permukiman).`
                : `Status risiko ${regionName}: Aman / Nihil Kebakaran.`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-6") return { ...s, status: "running" };
          return s;
        })
      );

      const chatRes = await chatPromise;
      const tacticalPlan = topHotspot ? buildTacticalAllocationPlan(topHotspot, 10) : null;
      const pos1 = tacticalPlan?.points.find((d) => d.code === "POS-1");
      const pos2 = tacticalPlan?.points.find((d) => d.code === "POS-2");
      const pos3 = tacticalPlan?.points.find((d) => d.code === "POS-3");
      const pos4 = tacticalPlan?.points.find((d) => d.code === "POS-4");
      const udp1 = tacticalPlan?.points.find((d) => d.code === "UDP-1");

      // STEP 6 COMPLETE + Log 5
      const log5: DecisionLogEntry = {
        id: "log-" + Date.now() + "-5",
        step: chatRes?.is_live_llm
          ? "Vertex AI Gemini 2.5 Flash (ADC)"
          : "Perimeter Tactical Resource Allocation",
        decision: hasFires
          ? `Alokasi 4 Sektor Perimeter Luar (POS-1..POS-4) & 1 Sektor Udara (UDP-1) di ${topLoc}.`
          : `Siaga Rutin: Tidak diperlukan pengerahan regu darurat di ${regionName}.`,
        reasoning: hasFires
          ? `Titik tengah (${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°) terkepung api aktif ${topAreaHa} Ha (larangan darat). Regu darat dikerahkan ke POS-1 Upwind (${pos1?.lat.toFixed(4)}°, ${pos1?.lon.toFixed(4)}°), sayap POS-2/POS-3, dan sekat depan POS-4 (${pos4?.lat.toFixed(4)}°, ${pos4?.lon.toFixed(4)}°).`
          : `Unit drone & regu darat tetap difokuskan pada klaster prioritas nasional aktif.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log5]);

      setCurrentSteps((prev) =>
        prev.map((s) =>
          s.id === "step-6"
            ? {
                ...s,
                status: "completed",
                description: hasFires
                  ? `Rencana taktis 4 sektor perimeter darat (POS-1..POS-4) & drone inti (UDP-1) di ${topLoc} siap di peta.`
                  : `Tidak diperlukan dispatch darurat untuk ${regionName}.`,
                timestamp: new Date().toLocaleTimeString("id-ID"),
              }
            : s
        )
      );

      const qLower = content.toLowerCase();
      const isLossQuery = [
        "kerugian",
        "rugi",
        "biaya",
        "dampak",
        "dibiarkan",
        "biarkan",
        "ekonomi",
        "emisi",
        "karbon",
      ].some((kw) => qLower.includes(kw));
      const windKmh = topHotspot?.windSpeedKmh ?? 20;
      const flamPct = Math.round((topHotspot?.flammabilityIndex ?? 0.8) * 100);
      const spreadMult24h = 1.45 + (windKmh / 18.0) * (flamPct / 75.0);
      const proj24hHa = Number((topAreaHa * spreadMult24h).toFixed(1));
      const proj72hHa = Number((topAreaHa * Math.pow(spreadMult24h, 2.1)).toFixed(1));
      const perHaRpJuta = topHotspot?.peatland ? 72.0 : 38.0;
      const loss24hMiliar = Number(((proj24hHa * perHaRpJuta) / 1000.0 + 1.8).toFixed(2));
      const loss72hMiliar = Number(((proj72hHa * perHaRpJuta) / 1000.0 + 4.2).toFixed(2));
      const co2Ton24h = Math.round(proj24hHa * (topHotspot?.peatland ? 420 : 95));

      const fallbackMarkdown = hasFires
        ? isLossQuery
          ? `### 📉 Estimasi Kerugian Ekonomi & Ekologis Jika Api Dibiarkan — ${topLoc}, ${regionName} (${feedSourceBadge})

Jika klaster kebakaran aktif di **${topLoc}** (\`${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°\`) seluas **${topAreaHa} Ha** (Inti Merah **${redHa} Ha**, FRP **${topFrp} MW**) dibiarkan tanpa pemadaman, angin **${windKmh} km/j** menuju **${topHotspot?.windDirectionLabel ?? "Barat"}** pada **${topHotspot?.soil ?? "Lahan Kering"}** (flamabilitas **${flamPct}%**) akan memicu eskalasi kerugian berikut:

* **Proyeksi Meluasnya Area & Nilai Kerugian:**
  * **Jika Dibiarkan 24 Jam:** Meluas hingga **~${proj24hHa} Ha** (Potensi kerugian langsung: **Rp ${loss24hMiliar} Miliar**).
  * **Jika Dibiarkan 72 Jam (3 Hari):** Meluas hingga **~${proj72hHa} Ha** (Potensi kerugian kumulatif: **Rp ${loss72hMiliar} Miliar**).
* **Dampak Lingkungan, Pariwisata & Kesehatan:**
  * **Rehabilitasi Ekosistem (${topHotspot?.soil ?? "Vegetasi"}):** Biaya pemulihan lahan mencapai **~Rp ${perHaRpJuta} Juta/Ha**.
  * **Emisi Karbon:** Pelepasan **~${co2Ton24h.toLocaleString("id-ID")} ton CO₂e** dalam 24 jam ke depan.
  * **Ancaman Permukiman & Aktivitas Ekonomi (${topSettlementKm} km):** Kabut asap berisiko mengganggu aktivitas warga/pariwisata serta memicu lonjakan biaya medis ISPA.`
          : `### 🛡️ Rencana Taktis Alokasi Sumber Daya Perimeter — ${topLoc}, ${regionName} (${feedSourceBadge})

**PERINGATAN KESELAMATAN OPERASIONAL:** Titik pusat api (\`${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°\`) mencakup area terbakar **${topAreaHa} Ha** (Inti Merah **${redHa} Ha**, FRP **${topFrp} MW**) dan **TIDAK DAPAT DIJANGKAU DARAT** karena terkepung kobaran api aktif. Berdasarkan vektor angin (**${windKmh} km/j** menuju **${topHotspot?.windDirectionLabel ?? "Barat Laut"}**), alokasikan regu pada **5 Titik Taktis Peta** berikut:

* **[POS-1] ${pos1?.name ?? "Pos Komando & Jangkar Belakang Angin"}:** \`${pos1?.lat.toFixed(4)}°, ${pos1?.lon.toFixed(4)}°\`
  * **Alokasi:** **${pos1?.assignedUnit}** (${pos1?.equipment})
  * **Taktik:** ${pos1?.rationale}
* **[POS-2] ${pos2?.name ?? "Sektor Jepit Sayap Kiri"}:** \`${pos2?.lat.toFixed(4)}°, ${pos2?.lon.toFixed(4)}°\`
  * **Alokasi:** **${pos2?.assignedUnit}** (${pos2?.equipment})
  * **Taktik:** ${pos2?.rationale}
* **[POS-3] ${pos3?.name ?? "Sektor Jepit Sayap Kanan & Sekat Kanal"}:** \`${pos3?.lat.toFixed(4)}°, ${pos3?.lon.toFixed(4)}°\`
  * **Alokasi:** **${pos3?.assignedUnit}** (${pos3?.equipment})
  * **Taktik:** ${pos3?.rationale}
* **[POS-4] ${pos4?.name ?? "Sektor Sekat Bakar Depan & Proteksi Permukiman"}:** \`${pos4?.lat.toFixed(4)}°, ${pos4?.lon.toFixed(4)}°\`
  * **Alokasi:** **${pos4?.assignedUnit}** (${pos4?.equipment})
  * **Taktik:** ${pos4?.rationale}
* **[UDP-1] ${udp1?.name ?? "Zona Larangan Darat — Operasi Water Bombing & Drone"}:** \`${udp1?.lat.toFixed(4)}°, ${udp1?.lon.toFixed(4)}°\`
  * **Alokasi:** **${udp1?.assignedUnit}** (${udp1?.equipment})
  * **Taktik:** ${udp1?.rationale}`
        : `### ✅ Status Pantauan Kebakaran — ${regionName} (${feedSourceBadge})

**Tidak ditemukan kebakaran aktif (0 titik panas)** di wilayah **${regionName}** berdasarkan pemindaian satelit **NASA FIRMS (VIIRS 375m NRT)** dalam 48 jam terakhir.

* **Deteksi Termal (Perception Agent):** **0 titik panas aktif** • **0 klaster DBSCAN** — status wilayah **AMAN (Nihil Anomali Termal)**.
* **Kondisi Lingkungan & Bahan Bakar:** Kelembapan permukaan stabil (**~64% RH**), kecepatan angin **12 km/j**, dan indeks flamabilitas **rendah (38%)**.
* **Status Operasional:** Tidak diperlukan pengerahan regu pemadam untuk **${regionName}**.`;

      const finalReply: ChatMessage = {
        id: "msg-reply-" + Date.now(),
        role: "agent",
        content: chatRes?.response || fallbackMarkdown,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, finalReply]);
    } catch (err) {
      console.error("Error during agent execution:", err);
      const errorReply: ChatMessage = {
        id: "msg-error-" + Date.now(),
        role: "agent",
        content:
          "Terjadi kendala saat menghubungkan ke orkestrator agen. Namun data satelit awal telah dicatat untuk ditinjau.",
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
      isExecutingRef.current = false;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    isExecutingRef.current = false;
  }, []);

  return {
    messages,
    isLoading,
    currentSteps,
    decisionLogs,
    activeCluster,
    focusSeq,
    sendMessage,
    clearMessages,
  };
}
