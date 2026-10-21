import React from "react";
import { User, Flame, CheckCircle2, Loader2, Cpu, ChevronRight } from "lucide-react";
import { ChatMessage as ChatMessageType, InvestigationStep, DecisionLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Agent Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Flame className="h-4 w-4" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div
        className={cn(
          "flex max-w-[85%] flex-col space-y-2 rounded-2xl p-4 text-sm shadow-md",
          isUser
            ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none ml-auto"
            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
        )}
      >
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span
            className={cn(
              "font-semibold uppercase tracking-wider",
              isUser ? "text-slate-900/80" : "text-amber-400"
            )}
          >
            {isUser ? "Analisis Karhutla (User)" : "SIGAP Agent AI"}
          </span>
          <span className={cn(isUser ? "text-slate-900/60" : "text-slate-500")}>
            {message.timestamp}
          </span>
        </div>

        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Embedded investigation steps if present */}
        {message.steps && message.steps.length > 0 && (
          <div className="mt-3 space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span>Langkah Investigasi Otomatis</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {message.steps.map((step: InvestigationStep) => (
                <div
                  key={step.id}
                  className="flex items-start gap-2 text-xs text-slate-300"
                >
                  {step.status === "completed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {step.status === "running" && (
                    <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0 mt-0.5" />
                  )}
                  {step.status === "pending" && (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium text-slate-200">{step.title}</span>
                    {step.description && (
                      <p className="text-[11px] text-slate-400">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedded decision logs if present */}
        {message.decisionLogs && message.decisionLogs.length > 0 && (
          <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-xs">
            <span className="font-medium text-amber-400/90 text-[11px]">
              Agent Reasoning & Decision:
            </span>
            {message.decisionLogs.map((log: DecisionLogEntry) => (
              <div key={log.id} className="mt-1 text-[11px] text-slate-400">
                <span className="text-slate-300 font-mono">[{log.step}]</span> {log.decision} —{" "}
                <span className="italic">{log.reasoning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
