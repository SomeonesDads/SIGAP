"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  FileCode,
  Share2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Report } from "@/lib/types";

const INITIAL_REPORTS: Report[] = [
  {
    id: "REP-2026-001",
    caseNumber: "SIGAP-2026-089",
    region: "Pulang Pisau, Kalimantan Tengah",
    date: "21 Okt 2026",
    status: "Draft",
    examiner: "SIGAP Agent AI (Manggala Agni Daops Kapuas)",
    summary:
      "Deteksi 18 titik panas VIIRS di lahan gambut dalam (>3m). Estimasi U-Net 1,240 Ha. Skor prioritas 95 (Kritis).",
    totalBurnedAreaHa: 1240,
    priorityScore: 95,
    exportFormats: ["pdf", "geojson"],
  },
  {
    id: "REP-2026-002",
    caseNumber: "SIGAP-2026-088",
    region: "Ketapang, Kalimantan Barat",
    date: "20 Okt 2026",
    status: "Selesai",
    examiner: "BPBD Kalbar / Tim Analis Citra",
    summary:
      "Perambatan ke batas hutan tanaman industri. Citra Landsat-8 terkonfirmasi dNBR 0.58. Sekat bakar telah dibuat sepanjang 3 km.",
    totalBurnedAreaHa: 890,
    priorityScore: 86,
    exportFormats: ["pdf", "geojson"],
  },
  {
    id: "REP-2026-003",
    caseNumber: "SIGAP-2026-087",
    region: "Ogan Komering Ilir, Sumatera Selatan",
    date: "19 Okt 2026",
    status: "Ditinjau",
    examiner: "KPH Wilayah II Sumsel",
    summary:
      "Kebakaran pada bekas areal kebakaran 2019 kanal restorasi gambut. Dilakukan pembasahan manual 2 unit pompa jinjing.",
    totalBurnedAreaHa: 420,
    priorityScore: 81,
    exportFormats: ["pdf", "geojson"],
  },
  {
    id: "REP-2026-004",
    caseNumber: "SIGAP-2026-086",
    region: "TN Sebangau, Kalimantan Tengah",
    date: "18 Okt 2026",
    status: "Arsip",
    examiner: "Balai Taman Nasional Sebangau",
    summary:
      "Spot fire tepi zona penyangga berhasil diisolasi sebelum memasuki hutan primer rawa gambut.",
    totalBurnedAreaHa: 1300,
    priorityScore: 74,
    exportFormats: ["pdf", "geojson"],
  },
  {
    id: "REP-2026-005",
    caseNumber: "SIGAP-2026-085",
    region: "Rokan Hilir, Riau",
    date: "15 Okt 2026",
    status: "Selesai",
    examiner: "Manggala Agni Daops Dumai",
    summary:
      "Verifikasi anomali termal pada perkebunan kelapa sawit rakyat. Terkendali oleh Masyarakat Peduli Api.",
    totalBurnedAreaHa: 180,
    priorityScore: 68,
    exportFormats: ["pdf", "geojson"],
  },
];

export function ReportList() {
  const [reports] = useState<Report[]>(INITIAL_REPORTS);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      report.region.toLowerCase().includes(search.toLowerCase()) ||
      report.examiner.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || report.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExport = (format: "pdf" | "geojson", reportId: string) => {
    alert(
      `Mengunduh berkas laporan format ${format.toUpperCase()} untuk dokumen ${reportId}...`
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID kasus, wilayah, atau nama pemeriksa..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Draft">Draft</option>
              <option value="Ditinjau">Ditinjau</option>
              <option value="Arsip">Arsip</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <Card className="p-0 overflow-hidden border-slate-800 bg-slate-900/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ID Kasus</th>
                <th className="py-3 px-4">Wilayah Operasional</th>
                <th className="py-3 px-4">Tanggal Analisis</th>
                <th className="py-3 px-4">Pemeriksa / Satuan</th>
                <th className="py-3 px-4">Status Laporan</th>
                <th className="py-3 px-4 text-right">Format Ekspor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReports.map((r) => {
                const isDraft = r.status === "Draft";
                const isCompleted = r.status === "Selesai";
                const isReviewed = r.status === "Ditinjau";

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-amber-400 text-xs">
                        {r.caseNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {r.id}
                      </div>
                    </td>

                    {/* Wilayah & Ringkasan */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100">
                        {r.region}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {r.summary}
                      </p>
                    </td>

                    {/* Tanggal */}
                    <td className="py-4 px-4 text-slate-300 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{r.date}</span>
                      </div>
                    </td>

                    {/* Pemeriksa */}
                    <td className="py-4 px-4">
                      <div className="text-slate-200 font-medium">
                        {r.examiner}
                      </div>
                      {r.totalBurnedAreaHa && (
                        <div className="text-[11px] text-amber-400/90 font-medium">
                          Luas: {r.totalBurnedAreaHa.toLocaleString()} Ha
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          isDraft
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isReviewed
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {r.status}
                      </span>
                    </td>

                    {/* Export Actions (PDF, GeoJSON) */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleExport("pdf", r.caseNumber)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-700 hover:border-amber-500/50 hover:text-amber-300"
                          title="Ekspor PDF Formal"
                        >
                          <FileText className="h-3.5 w-3.5 text-rose-400" />
                          <span>PDF</span>
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleExport("geojson", r.caseNumber)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-700 hover:border-amber-500/50 hover:text-amber-300"
                          title="Ekspor Spasial GeoJSON"
                        >
                          <FileCode className="h-3.5 w-3.5 text-emerald-400" />
                          <span>GeoJSON</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
