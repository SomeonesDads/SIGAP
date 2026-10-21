import React from "react";
import { ShieldCheck, ArrowDownToLine, Filter } from "lucide-react";
import { PriorityTable } from "@/components/priority/priority-table";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Priority Assessment — SIGAP",
  description:
    "Penilaian prioritas respon karhutla berbasis multikriteria: kedalaman gambut, kedekatan pemukiman, dan estimasi keparahan terbakar.",
};

export default function PriorityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-amber-400" />
            <span>Priority Assessment & Response Matrix</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Penentuan urutan prioritas verifikasi lapangan, pemadaman darat (Manggala Agni), dan alokasi water bombing (BPBD).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Kriteria</span>
          </Button>
          <Button variant="secondary" size="sm" className="text-xs gap-1.5">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>Unduh Matriks (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Priority Summary Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
          <span>
            <strong>Perhatian Operasional:</strong> 1 zona berada dalam kategori <strong>Prioritas Kritis</strong> dengan risiko perambatan bawah tanah pada kubah gambut.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Kalkulasi model terakhir: Hari ini, 10:15 WIB
        </span>
      </div>

      {/* Priority Table with 'Why This Area?' section */}
      <PriorityTable />
    </div>
  );
}
