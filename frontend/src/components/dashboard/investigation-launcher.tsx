"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvestigationLauncher() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleLaunch = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/investigation?q=${encodeURIComponent(prompt.trim())}`);
  };

  const samplePrompts = [
    "Analisis karhutla di Pulang Pisau 7 hari terakhir",
    "Cek hotspot di lahan gambut Ketapang",
    "Bandingkan citra Landsat sebelum dan sesudah api di Sebangau",
  ];

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 shadow-lg backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              AI Command Assistant
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mulai investigasi otonom menggunakan instruksi bahasa alami
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Didukung Model Segmentasi U-Net & NASA FIRMS</span>
        </div>
      </div>

      <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mulai investigasi... (contoh: Analisis potensi karhutla di Pulang Pisau)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="shrink-0 font-medium"
        >
          <span>Luncurkan AI</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Pintasan cepat:</span>
        {samplePrompts.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setPrompt(sample)}
            className="text-slate-400 hover:text-amber-300 underline-offset-2 hover:underline transition-colors text-[11px]"
          >
            "{sample}"
          </button>
        ))}
      </div>
    </div>
  );
}
