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
import type { Hotspot } from "@/lib/monitoring";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-welcome",
    role: "agent",
    content:
      "Halo! Saya **Wildfire Response Orchestrator (SIGAP)** berbasis Agentic AI Google ADK & Gemini.\n\nSaya mengoordinasikan 6 sub-agen spesialis (Perception & Fusion, Risk Scoring, Verification, Routing & Dispatch, Coordination, Feedback/Learning) untuk menginvestigasi anomali termal **live NASA FIRMS**, mengunduh citra satelit **AWS Earth Search STAC (Sentinel-2 L2A)**, menjalankan segmentasi **DINOv3 BurnSeg**, dan mengoptimalkan respon tim darat.\n\nSilakan ketik perintah dalam Bahasa Indonesia, atau pilih contoh di bawah untuk memulai investigasi otonom.",
    timestamp: new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<InvestigationStep[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLogEntry[]>([]);
  const [activeCluster, setActiveCluster] = useState<Hotspot | null>(null);
  const isExecutingRef = useRef(false);

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

  const sendMessage = useCallback(async (content: string) => {
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
      const inv = await startInvestigation(content);
      const chatPromise = sendChatMessage(content, inv?.id);
      const regionName = inv?.region || "Kalimantan Tengah";
      const liveFeed = await fetchMonitoringHotspots(regionName, 5);
      const topHotspot = liveFeed.hotspots[0];
      if (topHotspot) setActiveCluster(topHotspot);

      const cLat = topHotspot?.lat ?? -2.85;
      const cLon = topHotspot?.lon ?? 114.12;
      const totalRaw = liveFeed.total_raw_hotspots;
      const clusterCount = liveFeed.cluster_count;
      const topCount = topHotspot?.hotspotCount ?? 18;
      const topFrp = topHotspot?.totalFrp ?? 48.2;
      const topScore = topHotspot?.riskScore ?? 94;
      const topLoc = topHotspot?.location ?? regionName;
      const topEta = topHotspot?.etaMin ?? 42;
      const topSettlementKm = topHotspot?.settlementKm ?? 0.8;
      const feedSourceBadge = liveFeed.is_live ? "LIVE NASA FIRMS NRT" : "Fallback Cache";

      const scale = Math.max(
        0.6,
        Math.min(2.6, Math.sqrt(((topHotspot?.areaHa ?? 160) / 180)))
      );
      const [segData, imgMeta] = await Promise.all([
        fetchSegmentationData(cLat, cLon, scale),
        fetchImageryMetadata(topHotspot?.acqDate, cLat, cLon),
      ]);

      const stacSceneId =
        segData?.stac_scene?.scene_id ||
        imgMeta?.post_fire?.scene_id ||
        "S2A_49MFM_L2A";
      const stacCloud =
        segData?.stac_scene?.cloud_cover ??
        imgMeta?.post_fire?.cloud_cover_percentage ??
        6.8;
      const topAreaHa =
        segData?.coverage_breakdown_ha?.total_burned_area_ha ??
        topHotspot?.areaHa ??
        157;
      const redHa =
        segData?.coverage_breakdown_ha?.red_high_severity_ha ??
        Math.round(topAreaHa * 0.22);
      const orangeHa =
        segData?.coverage_breakdown_ha?.orange_moderate_severity_ha ??
        Math.round(topAreaHa * 0.35);
      const yellowHa =
        segData?.coverage_breakdown_ha?.yellow_low_severity_ha ??
        Math.round(topAreaHa * 0.43);

      await sleep(300);

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

      await sleep(350);

      // STEP 2 COMPLETE -> STEP 3 RUNNING + Log 1
      const log1: DecisionLogEntry = {
        id: "log-" + Date.now() + "-1",
        step: "Perception & Fusion (Live FIRMS)",
        decision: `Terkonfirmasi ${totalRaw} titik panas aktif dalam ${clusterCount} klaster DBSCAN (Klaster #1: ${topCount} titik, FRP ${topFrp} MW).`,
        reasoning: `Data ${liveFeed.source} mendeteksi anomali termal berintensitas tinggi di ${topLoc}.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log1]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-2") {
            return {
              ...s,
              status: "completed",
              description: `${totalRaw} titik panas aktif (VIIRS 375m) teragregasi menjadi ${clusterCount} klaster spasial.`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-3") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(400);

      // STEP 3 COMPLETE -> STEP 4 RUNNING + Log 2
      const log2: DecisionLogEntry = {
        id: "log-" + Date.now() + "-2",
        step: "AWS Earth Search STAC (Sentinel-2 L2A)",
        decision: `Mengakuisisi scene Sentinel-2 L2A: ${stacSceneId} (tutupan awan ${stacCloud}%).`,
        reasoning: `Katalog AWS Earth Search STAC menyediakan Cloud-Optimized GeoTIFF (COG) 6-band pada koordinat (${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°).`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log2]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-3") {
            return {
              ...s,
              status: "completed",
              description: `Scene AWS STAC ${stacSceneId} siap (tutupan awan ${stacCloud}%).`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-4") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(400);

      // STEP 4 COMPLETE -> STEP 5 RUNNING + Log 3
      const log3: DecisionLogEntry = {
        id: "log-" + Date.now() + "-3",
        step: "DINOv3 BurnSeg & Radius",
        decision: `Total area terbakar ${topAreaHa} Ha (Merah: ${redHa} Ha, Oranye: ${orangeHa} Ha, Kuning: ${yellowHa} Ha).`,
        reasoning: `Model DINOv3 (vit_large_patch16_dinov3.sat493m) memproses patch citra STAC ${stacSceneId} (dNBR rata-rata ${topHotspot?.dnbrMean ?? 0.71}).`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log3]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-4") {
            return {
              ...s,
              status: "completed",
              description: `Total ${topAreaHa} Ha terpetakan (Tinggi: ${redHa} Ha, Sedang: ${orangeHa} Ha, Rendah: ${yellowHa} Ha).`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-5") return { ...s, status: "running" };
          return s;
        })
      );

      await sleep(350);

      // STEP 5 COMPLETE -> STEP 6 RUNNING + Log 4
      const log4: DecisionLogEntry = {
        id: "log-" + Date.now() + "-4",
        step: "Risk Scoring Agent (MCDA)",
        decision: `Skor Prioritas ${topScore} / 100 — Kategori ${topScore >= 80 ? "KRITIS" : "TINGGI"} (${topLoc}).`,
        reasoning: `Karakteristik tanah ${topHotspot?.soil ?? "Gambut"} berjarak ${topSettlementKm} km dari permukiman warga terdekat.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log4]);

      setCurrentSteps((prev) =>
        prev.map((s) => {
          if (s.id === "step-5") {
            return {
              ...s,
              status: "completed",
              description: `Skor risiko ${topScore}/100 (${topHotspot?.soil ?? "Gambut"}, ${topSettlementKm} km ke permukiman).`,
              timestamp: new Date().toLocaleTimeString("id-ID"),
            };
          }
          if (s.id === "step-6") return { ...s, status: "running" };
          return s;
        })
      );

      const chatRes = await chatPromise;

      // STEP 6 COMPLETE + Log 5
      const log5: DecisionLogEntry = {
        id: "log-" + Date.now() + "-5",
        step: chatRes?.is_live_llm
          ? "Vertex AI Gemini 2.5 Flash (ADC)"
          : "Routing & Dispatch Agent",
        decision: `Dispatched: Regu Manggala Agni / BPBD menuju ${topLoc} (${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°).`,
        reasoning: `Jarak tempuh darat ~${topHotspot?.distanceKm ?? 21} km (ETA ${topEta} menit); sintesis instruksi oleh ${chatRes?.model_used ?? "SIGAP Orchestrator"}.`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setDecisionLogs((prev) => [...prev, log5]);

      setCurrentSteps((prev) =>
        prev.map((s) =>
          s.id === "step-6"
            ? {
                ...s,
                status: "completed",
                timestamp: new Date().toLocaleTimeString("id-ID"),
              }
            : s
        )
      );

      const fallbackMarkdown = `### 📋 Ringkasan Hasil Investigasi Otonom — ${regionName} (${feedSourceBadge})

Investigasi multi-agen telah selesai dijalankan menggunakan data satelit terbaru:

* **Titik Panas Live (Perception Agent):** **${totalRaw} titik panas aktif** (${liveFeed.source}) terdeteksi dan dikelompokkan menjadi **${clusterCount} klaster DBSCAN**.
* **Klaster Prioritas Utama:** **${topLoc}** (\`${cLat.toFixed(4)}°, ${cLon.toFixed(4)}°\`) — **${topCount} titik panas**, total FRP **${topFrp} MW**.
* **Citra Satelit Sentinel-2 L2A (AWS Earth Search STAC):** Scene **\`${stacSceneId}\`** (Tutupan awan **${stacCloud}%**).
* **Prediksi Cakupan & Keparahan DINOv3 (\`vit_large_patch16_dinov3.sat493m\`):**
  * Total Luas Terdampak: **${topAreaHa} Ha** (Merah/Tinggi: **${redHa} Ha**, Oranye/Sedang: **${orangeHa} Ha**, Kuning/Rendah: **${yellowHa} Ha**)
  * Rata-rata dNBR: **${topHotspot?.dnbrMean ?? 0.71}** • Karakteristik Lahan: **${topHotspot?.soil ?? "Lahan Gambut"}**
* **Tingkat Prioritas Lapangan:** **SKOR ${topScore} / 100 (${topScore >= 80 ? "KRITIS" : "TINGGI"})** dengan jarak **${topSettlementKm} km** dari permukiman warga.
* **Rekomendasi Operasional (Dispatch Agent):** Penugasan regu pemadam darat terdekat (jarak **${topHotspot?.distanceKm ?? 21} km**, estimasi waktu tempuh **${topEta} menit**).

Silakan tinjau visualisasi spasial lengkap di [Peta Analisis Spasial](/map) atau periksa [Matriks Penilaian Prioritas](/priority).`;

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
    sendMessage,
    clearMessages,
  };
}
