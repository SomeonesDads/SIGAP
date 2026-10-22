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
  placeholder = "Instruksikan agen (misal: Analisis Pulang Pisau)...",
  suggestedPrompts = [
    "Analisis Pulang Pisau 7 hari terakhir",
    "Area gambut klaster aktif",
    "Prioritas dekat permukiman",
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
    <div className="w-full space-y-1.5">
      {/* Quick Prompts Suggestions */}
      {suggestedPrompts.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5 shrink-0">
            <Sparkles className="h-2.5 w-2.5 text-amber-700" />
            Saran:
          </span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(prompt);
              }}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-800"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1 shadow-xs focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 min-w-0 bg-transparent px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isLoading}
          className="h-7 px-2.5 text-xs shrink-0 rounded-md gap-1"
        >
          {isLoading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
          ) : (
            <>
              <span>Kirim</span>
              <SendHorizontal className="h-3 w-3" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
