"use client";

import { useState, useCallback } from "react";
import { ChatMessage, InvestigationStep, DecisionLogEntry } from "@/lib/types";
import { startInvestigation } from "@/lib/api";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-welcome",
    role: "agent",
    content:
      "Halo! Saya Agen Karhutla SIGAP. Saya siap membantu Anda melakukan investigasi mandiri berbasis data NASA FIRMS, citra satelit Landsat/Sentinel, segmentasi U-Net, dan analisis prioritas patroli karhutla.\n\nKetik perintah atau pilih contoh di bawah untuk memulai.",
    timestamp: "10:00",
  },
];

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<InvestigationStep[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLogEntry[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

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

    try {
      // Call API or mock
      const investigation = await startInvestigation(content);

      const agentSteps: InvestigationStep[] = [
        {
          id: "step-1",
          title: "Pemahaman Perintah & Ekstraksi Wilayah",
          description: `Mendeteksi fokus wilayah: ${investigation.region}`,
          status: "completed",
        },
        {
          id: "step-2",
          title: "Pengambilan Titik Panas NASA FIRMS",
          description: "Mengambil data VIIRS 375m & MODIS 1km pada periode aktif.",
          status: "completed",
        },
        {
          id: "step-3",
          title: "Pengambilan Citra Satelit Landsat 8/9",
          description: "Mengevaluasi tutupan awan & komposit Before-After GEE.",
          status: "running",
        },
        {
          id: "step-4",
          title: "Segmentasi U-Net & Analisis dNBR",
          description: "Prediksi area terbakar dan tingkat keparahan.",
          status: "pending",
        },
        {
          id: "step-5",
          title: "Penilaian Prioritas Wilayah & Tindakan",
          description: "Overlay batas gambut & jarak ke permukiman penduduk.",
          status: "pending",
        },
      ];

      const logs: DecisionLogEntry[] = [
        {
          id: "log-1",
          step: "Hotspot Clustering",
          decision: "Ditemukan 2 klaster prioritas di Pulang Pisau Selatan.",
          reasoning: "Densitas titik panas > 5 titik dalam radius 3 km.",
          timestamp: new Date().toLocaleTimeString("id-ID"),
        },
        {
          id: "log-2",
          step: "Satellite Selection",
          decision: "Menggunakan Landsat-8 Tier 1 Surface Reflectance.",
          reasoning: "Tutupan awan < 20% pada akuisisi terdekat.",
          timestamp: new Date().toLocaleTimeString("id-ID"),
        },
      ];

      setCurrentSteps(agentSteps);
      setDecisionLogs(logs);

      const agentReply: ChatMessage = {
        id: "msg-reply-" + Date.now(),
        role: "agent",
        content: `Investigasi karhutla mandiri telah diinisiasi untuk wilayah **${investigation.region}**.\n\nSistem menemukan indikasi anomali termal dan sedang memproses citra satelit serta segmentasi area terbakar. Pantau alur eksekusi di panel kanan untuk melihat perkembangan investigasi.`,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        steps: agentSteps,
        decisionLogs: logs,
      };

      setMessages((prev) => [...prev, agentReply]);
    } catch (err) {
      const errorReply: ChatMessage = {
        id: "msg-error-" + Date.now(),
        role: "agent",
        content: "Terjadi kesalahan saat memproses investigasi. Silakan periksa koneksi backend atau coba beberapa saat lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setCurrentSteps([]);
    setDecisionLogs([]);
  }, []);

  return {
    messages,
    isLoading,
    currentSteps,
    decisionLogs,
    sendMessage,
    clearMessages,
  };
}
