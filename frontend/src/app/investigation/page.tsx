"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  Activity,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Download,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function InvestigationContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q");

  const {
    messages,
    isLoading,
    currentSteps,
    decisionLogs,
    sendMessage,
    clearMessages,
  } = useChat();

  // If a query parameter was passed from dashboard, auto trigger
  useEffect(() => {
    if (queryParam && messages.length <= 1) {
      sendMessage(queryParam);
    }
  }, [queryParam, sendMessage, messages.length]);

  // Fallback default sample steps if none have been run yet
  const displaySteps =
    currentSteps.length > 0
      ? currentSteps
      : [
          {
            id: "step-sample-1",
            title: "Pengenalan Intent & Ekstraksi Lokasi",
            description: "Sistem mengenali koordinat bounding box dan target waktu.",
            status: "completed" as const,
            timestamp: "10:02:14",
          },
          {
            id: "step-sample-2",
            title: "Agregasi Hotspot NASA FIRMS (VIIRS 375m)",
            description: "Memfilter titik anomali termal dengan tingkat keyakinan nominal/tinggi.",
            status: "completed" as const,
            timestamp: "10:02:19",
          },
          {
            id: "step-sample-3",
            title: "Seleksi & Akuisisi Citra Landsat 8/9 GEE",
            description: "Menghitung tutupan awan < 15% pada scene path/row 118/062.",
            status: "running" as const,
            timestamp: "10:02:25",
          },
          {
            id: "step-sample-4",
            title: "Segmentasi U-Net & Deteksi Burn Scar",
            description: "Inferensi citra multikanal untuk memisahkan piksel terbakar.",
            status: "pending" as const,
          },
          {
            id: "step-sample-5",
            title: "Matriks Penilaian Dampak & Aksesibilitas",
            description: "Overlay tutupan lahan gambut dan jarak ke permukiman terdekat.",
            status: "pending" as const,
          },
        ];

  const displayDecisionLogs =
    decisionLogs.length > 0
      ? decisionLogs
      : [
          {
            id: "dec-sample-1",
            step: "AOI Definition",
            decision: "Cakupan area dibatasi pada koordinat [-3.15, 114.05, -2.85, 114.35].",
            reasoning: "Densitas titik panas FIRMS terakumulasi dalam klaster 15 km persegi.",
            timestamp: "10:02:16",
          },
          {
            id: "dec-sample-2",
            step: "Cloud Cover Strategy",
            decision: "Mengganti citra tanggal 18 Okt dengan komposit 3-hari terdekat.",
            reasoning: "Tutupan awan scene 18 Okt melebihi toleransi (45% awan tebal).",
            timestamp: "10:02:22",
          },
          {
            id: "dec-sample-3",
            step: "Priority Scoring",
            decision: "Menetapkan status respon cepat: Kategori A (Siaga Lapangan).",
            reasoning: "Zona berada di hamparan kubah gambut berjarak 850m dari permukiman warga.",
            timestamp: "10:02:30",
          },
        ];

  return (
    <div className="space-y-4">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              AI Investigation Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Lingkungan kerja percakapan otonom: inferensi model, analisis spasial, dan alur pengambilan keputusan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Percakapan</span>
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono">
            <Bot className="h-3.5 w-3.5" />
            <span>SIGAP Agent v1.0</span>
          </div>
        </div>
      </div>

      {/* Split Layout: Chat Panel (Left) + Execution Timeline & Decision Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Chat Conversation (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] rounded-xl border border-slate-800 bg-slate-950/80 shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Konsol Asisten Karhutla
                </h3>
                <span className="text-[10px] text-slate-400">
                  Bahasa Alami Indonesia • Eksekusi Tool Otonom
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Agen Siap
              </span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-amber-400 bg-slate-900/80 border border-amber-500/20 rounded-xl p-3.5 w-fit">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div>
                  <span className="font-semibold block text-slate-200">
                    Agen sedang mengevaluasi data...
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Memproses query spasial, memeriksa citra satelit, dan menghitung estimasi U-Net
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-slate-800 bg-slate-900/90 p-3">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder="Instruksikan agen (contoh: Analisis potensi karhutla di Pulang Pisau)..."
            />
          </div>
        </div>

        {/* Right Column: Execution Timeline + Agent Decision Log (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5 h-[750px] overflow-y-auto pr-1">
          {/* Execution Timeline Panel */}
          <Card className="p-4 border-slate-800 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Alur Eksekusi Agen (Execution Plan)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                5 Langkah Kerja
              </span>
            </div>

            <div className="mt-4 space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {displaySteps.map((step) => {
                const isCompleted = step.status === "completed";
                const isRunning = step.status === "running";
                const isPending = step.status === "pending";

                return (
                  <div key={step.id} className="relative flex items-start gap-3 pl-1">
                    <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 border border-slate-700">
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {isRunning && (
                        <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                      )}
                      {isPending && (
                        <Clock className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isRunning
                              ? "text-amber-300"
                              : isCompleted
                              ? "text-slate-200"
                              : "text-slate-400"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300"
                              : isRunning
                              ? "bg-amber-500/20 text-amber-300 animate-pulse"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                          {step.description}
                        </p>
                      )}
                      {step.timestamp && (
                        <span className="mt-1 block text-[10px] text-slate-500 font-mono">
                          Waktu eksekusi: {step.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Agent Decision Log Panel */}
          <Card className="p-4 border-slate-800 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Agent Decision Log (Audit Trail)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Log Transparan
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Catatan alasan dan pemikiran di balik setiap tindakan otonom yang diambil oleh model AI:
            </p>

            <div className="space-y-2.5">
              {displayDecisionLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-medium">
                      {log.step}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-slate-200 font-medium">
                    {log.decision}
                  </div>

                  <div className="text-[11px] text-slate-400 border-l-2 border-amber-500/50 pl-2 italic">
                    <span className="text-amber-400/80 not-italic font-semibold">Alasan: </span>
                    {log.reasoning}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Export / Link to Report */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" className="text-xs gap-1.5 w-full">
                <FileCode className="h-3.5 w-3.5" />
                <span>Ekspor Keputusan (JSON)</span>
              </Button>
              <Button variant="secondary" size="sm" className="text-xs gap-1.5 w-full">
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Laporan Sesi</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function InvestigationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">
          Memuat Workspace Investigasi...
        </div>
      }
    >
      <InvestigationContent />
    </Suspense>
  );
}
