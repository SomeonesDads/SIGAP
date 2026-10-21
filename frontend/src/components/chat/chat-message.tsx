import React from "react";
import { User, Flame, CheckCircle2, Loader2, Cpu } from "lucide-react";
import { ChatMessage as ChatMessageType, InvestigationStep, DecisionLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Parse inline Markdown tokens (`code`, ***bold-italic***, **bold**, *italic*, _italic_) into React nodes. */
function renderInlineMarkdown(text: string, isUser = false): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex =
    /(`[^`]+`|\*\*\*(?:(?!\*\*\*)[^\n])+\*\*\*|\*\*(?:(?!\*\*)[^\n])+\*\*|\*[^*\n]+\*|_[^_\n]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`code-${keyIdx++}`}
          className={cn(
            "rounded px-1 py-0.5 font-mono text-[10.5px] font-medium",
            isUser
              ? "bg-amber-600/30 text-slate-950"
              : "border border-slate-200/90 bg-slate-100 text-amber-900"
          )}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      nodes.push(
        <strong
          key={`bi-${keyIdx++}`}
          className={cn("font-bold italic", isUser ? "text-slate-950" : "text-slate-900")}
        >
          {renderInlineMarkdown(token.slice(3, -3), isUser)}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong
          key={`b-${keyIdx++}`}
          className={cn("font-semibold", isUser ? "text-slate-950" : "text-slate-900")}
        >
          {renderInlineMarkdown(token.slice(2, -2), isUser)}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      nodes.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {renderInlineMarkdown(token.slice(1, -1), isUser)}
        </em>
      );
    } else {
      nodes.push(token);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

/** Render block-level Markdown (headings #, ##, ###, bullet lists, numbered lists, blockquotes, paragraphs). */
function renderMarkdownBlocks(content: string, isUser = false): React.ReactNode {
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];
  let blockKey = 0;

  const flushLists = () => {
    if (bulletItems.length > 0) {
      elements.push(
        <ul key={`ul-${blockKey++}`} className="my-1 space-y-1">
          {bulletItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-snug">
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  isUser ? "bg-slate-900" : "bg-amber-500"
                )}
              />
              <span className="flex-1">{renderInlineMarkdown(item, isUser)}</span>
            </li>
          ))}
        </ul>
      );
      bulletItems = [];
    }
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={`ol-${blockKey++}`} className="my-1 list-decimal space-y-1 pl-4">
          {orderedItems.map((item, idx) => (
            <li key={idx} className="leading-snug">
              {renderInlineMarkdown(item, isUser)}
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushLists();
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushLists();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      elements.push(
        <div
          key={`h-${blockKey++}`}
          className={cn(
            "font-bold leading-snug",
            level === 1
              ? "border-b border-slate-200 pb-1 text-sm text-slate-900"
              : level === 2
              ? "border-b border-slate-200 pb-1 text-[13px] text-slate-900"
              : "border-b border-slate-200/80 pb-1 text-[12.5px] text-slate-900"
          )}
        >
          {renderInlineMarkdown(headingText, isUser)}
        </div>
      );
      continue;
    }

    // Unordered list (* or - or •)
    const ulMatch = trimmed.match(/^([*\-•])\s+(.+)$/);
    if (ulMatch) {
      if (orderedItems.length > 0) flushLists();
      bulletItems.push(ulMatch[2]);
      continue;
    }

    // Ordered list (1. 2. etc.)
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (bulletItems.length > 0) flushLists();
      orderedItems.push(olMatch[1]);
      continue;
    }

    // Blockquote (> ...)
    const bqMatch = trimmed.match(/^>\s*(.+)$/);
    if (bqMatch) {
      flushLists();
      elements.push(
        <blockquote
          key={`bq-${blockKey++}`}
          className="my-1 rounded-r border-l-2 border-amber-500 bg-amber-50/70 px-2 py-1 text-[11px] italic text-slate-700"
        >
          {renderInlineMarkdown(bqMatch[1], isUser)}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushLists();
      elements.push(<hr key={`hr-${blockKey++}`} className="my-1.5 border-slate-200" />);
      continue;
    }

    flushLists();
    elements.push(
      <p key={`p-${blockKey++}`} className="leading-snug">
        {renderInlineMarkdown(trimmed, isUser)}
      </p>
    );
  }

  flushLists();
  return <div className="space-y-1.5 text-xs">{elements}</div>;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2 py-1",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Agent Avatar */}
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 mt-0.5">
          <Flame className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div
        className={cn(
          "flex max-w-[88%] flex-col space-y-1.5 rounded-xl px-3 py-2 text-xs shadow-xs",
          isUser
            ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none ml-auto"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
        )}
      >
        <div className="flex items-center justify-between gap-3 text-[10px]">
          <span
            className={cn(
              "font-semibold uppercase tracking-wider",
              isUser ? "text-slate-900/80" : "text-amber-700"
            )}
          >
            {isUser ? "Operator" : "SIGAP Agent AI"}
          </span>
          <span
            suppressHydrationWarning
            className={cn(isUser ? "text-slate-900/60" : "text-slate-400")}
          >
            {message.timestamp}
          </span>
        </div>

        {renderMarkdownBlocks(message.content, isUser)}

        {/* Embedded investigation steps if present */}
        {message.steps && message.steps.length > 0 && (
          <div className="mt-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Cpu className="h-3 w-3 text-amber-700" />
              <span>Langkah Investigasi Otomatis</span>
            </div>
            <div className="space-y-1 pt-0.5">
              {message.steps.map((step: InvestigationStep) => (
                <div
                  key={step.id}
                  className="flex items-start gap-1.5 text-[11px] text-slate-700"
                >
                  {step.status === "completed" && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-700 shrink-0 mt-0.5" />
                  )}
                  {step.status === "running" && (
                    <Loader2 className="h-3 w-3 text-amber-700 animate-spin shrink-0 mt-0.5" />
                  )}
                  {step.status === "pending" && (
                    <div className="h-3 w-3 rounded-full border border-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium text-slate-800">{step.title}</span>
                    {step.description && (
                      <p className="text-[10px] text-slate-600">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedded decision logs if present */}
        {message.decisionLogs && message.decisionLogs.length > 0 && (
          <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px]">
            <span className="font-medium text-amber-700/90 text-[10px]">
              Agent Reasoning & Decision:
            </span>
            {message.decisionLogs.map((log: DecisionLogEntry) => (
              <div key={log.id} className="mt-0.5 text-[10px] text-slate-600">
                <span className="text-slate-700 font-mono">[{log.step}]</span> {log.decision} —{" "}
                <span className="italic">{log.reasoning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md bg-slate-100 border border-slate-300 text-slate-800 mt-0.5">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
