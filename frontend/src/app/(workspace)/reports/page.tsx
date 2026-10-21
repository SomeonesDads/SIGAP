import React from "react";
import { FileText, PlusCircle, DownloadCloud } from "lucide-react";
import { ReportList } from "@/components/reports/report-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Reports & Case History — SIGAP",
  description:
    "Daftar riwayat investigasi karhutla masa lalu, ringkasan bukti satelit, dan ekspor laporan format PDF serta GeoJSON.",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-medium tracking-[-0.02em] text-black flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-amber-700" />
            <span>Reports & Case History</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Dokumentasi berkas hasil investigasi AI, evaluasi kerusakan vegetasi, dan catatan verifikasi tim gabungan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs gap-1.5">
            <DownloadCloud className="h-3.5 w-3.5" />
            <span>Unduh Semua Berkas (ZIP)</span>
          </Button>

          <Link href="/investigation">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Investigasi Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Reports List */}
      <ReportList />
    </div>
  );
}
