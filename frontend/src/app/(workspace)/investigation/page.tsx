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
  ShieldCheck,
  RotateCcw,
  Download,
  FileCode,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { getReportDownloadUrl } from "@/lib/api";
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
    activeCluster,
    sendMessage,
    clearMessages,
  } = useChat();

  // If a query parameter was passed from dashboard, auto trigger
  useEffect(() => {
    if (queryParam && messages.length <= 1) {
      sendMessage(queryParam);
    }
  }, [queryParam, sendMessage, messages.length]);

  const handleExportDecisionsJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      agent: "SIGAP Wildfire Response Orchestrator",
      active_cluster: activeCluster,
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

  const handleDownloadSessionPdf = () => {
    const caseId = activeCluster?.id || "SIGAP-2026-LIVE-01";
    const url = getReportDownloadUrl(
      caseId,
      activeCluster?.lat,
      activeCluster?.lon
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Session_Report_${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-mono font-medium tracking-[-0.02em] text-black">
              AI Investigation Workspace
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/30">
              LIVE FIRMS + AWS STAC + DINOV3
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Lingkungan kerja percakapan otonom: inferensi DINOv3 pada citra Sentinel-2 L2A (AWS STAC), analisis spasial, dan audit keputusan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Percakapan</span>
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-amber-700 font-mono">
            <Bot className="h-3.5 w-3.5" />
            <span>SIGAP Agent v1.0</span>
          </div>
        </div>
      </div>

      {/* Split Layout: Chat Panel (Left) + Execution Timeline & Decision Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Chat Conversation (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] rounded-xl border border-slate-200 bg-slate-100 shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Konsol Asisten Karhutla
                </h3>
                <span className="text-[10px] text-slate-600">
                  Bahasa Alami Indonesia • Eksekusi Tool Otonom
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
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
              <div className="flex items-center gap-3 text-xs text-amber-700 bg-white border border-amber-500/20 rounded-xl p-3.5 w-fit">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div>
                  <span className="font-semibold block text-slate-800">
                    Agen sedang mengevaluasi data...
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Memproses query spasial FIRMS, mengambil scene AWS STAC Sentinel-2, dan menjalankan DINOv3
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-slate-200 bg-white p-3">
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
          <Card className="p-4 border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Alur Eksekusi Agen (Execution Plan)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                {currentSteps.length || 5} Langkah Kerja
              </span>
            </div>

            <div className="mt-4 space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {currentSteps.length === 0 && (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Memuat telemetri klaster live NASA FIRMS & AWS STAC...
                </div>
              )}
              {currentSteps.map((step) => {
                const isCompleted = step.status === "completed";
                const isRunning = step.status === "running";
                const isPending = step.status === "pending";

                return (
                  <div key={step.id} className="relative flex items-start gap-3 pl-1">
                    <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-300">
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      )}
                      {isRunning && (
                        <Loader2 className="h-4 w-4 text-amber-700 animate-spin" />
                      )}
                      {isPending && (
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 rounded-lg border border-slate-200/80 bg-slate-100 p-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isRunning
                              ? "text-amber-700"
                              : isCompleted
                              ? "text-slate-800"
                              : "text-slate-600"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-700"
                              : isRunning
                              ? "bg-amber-500/20 text-amber-700 animate-pulse"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mt-1 text-[11px] text-slate-600 leading-snug">
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
          <Card className="p-4 border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-700" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Agent Decision Log (Audit Trail)
                </h3>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">
                Log Transparan
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 mb-3">
              Catatan alasan dan pemikiran di balik setiap tindakan otonom yang diambil oleh model AI:
            </p>

            <div className="space-y-2.5">
              {decisionLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-cyan-700 font-medium">
                      {log.step}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium">
                    {log.decision}
                  </div>

                  <div className="text-[11px] text-slate-600 border-l-2 border-amber-500/50 pl-2 italic">
                    <span className="text-amber-700/80 not-italic font-semibold">Alasan: </span>
                    {log.reasoning}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Export / Link to Report */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportDecisionsJson}
                className="text-xs gap-1.5 w-full"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Ekspor Keputusan (JSON)</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadSessionPdf}
                className="text-xs gap-1.5 w-full"
              >
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
        <div className="p-8 text-center text-slate-600">
          Memuat Workspace Investigasi...
        </div>
      }
    >
      <InvestigationContent />
    </Suspense>
  );
}
