"use client";

import React, { useState, FormEvent, KeyboardEvent } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestedPrompts?: string[];
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Mulai investigasi karhutla (contoh: Analisis Pulang Pisau 7 hari terakhir)...",
  suggestedPrompts = [
    "Analisis potensi karhutla di Pulang Pisau 7 hari terakhir",
    "Tampilkan area gambut dengan klaster hotspot aktif",
    "Hitung dNBR dan prioritaskan wilayah dekat permukiman",
  ],
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Quick Prompts Suggestions */}
      {suggestedPrompts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Saran:
          </span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(prompt);
              }}
              className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-amber-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-lg backdrop-blur-sm focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/50"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isLoading}
          className="h-9 px-4 shrink-0 rounded-lg"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
          ) : (
            <>
              <span>Kirim</span>
              <SendHorizontal className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
