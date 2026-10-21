"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  FileCode,
  Calendar,
  DownloadCloud,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchReportGeoJSON,
  fetchReports,
  getReportDownloadUrl,
  type LiveReportItem,
} from "@/lib/api";

const INITIAL_REPORTS: LiveReportItem[] = [
  {
    id: "REP-2026-001",
    caseNumber: "SIGAP-2026-089",
    region: "Pulang Pisau, Kalimantan Tengah",
    date: "21 Okt 2026",
    status: "Draft",
    examiner: "SIGAP Agent AI (Manggala Agni Daops Kapuas)",
    summary:
      "Deteksi 18 titik panas VIIRS di lahan gambut dalam (>3m). Estimasi DINOv3 1,240 Ha. Skor prioritas 95 (Kritis).",
    totalBurnedAreaHa: 1240,
    priorityScore: 95,
    exportFormats: ["pdf", "geojson"],
    lat: -2.85,
    lon: 114.12,
  },
];

export function ReportList() {
  const [reports, setReports] = useState<LiveReportItem[]>(INITIAL_REPORTS);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchReports("Kalimantan", 10).then((res) => {
      if (!active || !res || !res.reports.length) return;
      setReports(res.reports);
      setIsLive(res.is_live);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      report.region.toLowerCase().includes(search.toLowerCase()) ||
      report.examiner.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || report.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExport = async (
    format: "pdf" | "geojson",
    report: LiveReportItem
  ) => {
    const key = `${report.caseNumber}:${format}`;
    setExportingKey(key);
    try {
      if (format === "pdf") {
        const url = getReportDownloadUrl(
          report.caseNumber,
          report.lat,
          report.lon
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `SIGAP_Report_${report.caseNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const geojson = await fetchReportGeoJSON(
          report.caseNumber,
          report.lat,
          report.lon
        );
        if (!geojson) return;
        const blob = new Blob([JSON.stringify(geojson, null, 2)], {
          type: "application/geo+json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SIGAP_Spatial_${report.caseNumber}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportingKey(null);
    }
  };

  const handleExportAllBundle = () => {
    const bundle = {
      generated_at: new Date().toISOString(),
      source: isLive ? "LIVE NASA FIRMS + DINOv3" : "SIGAP Archive",
      total_cases: filteredReports.length,
      cases: filteredReports,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Case_History_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-mono font-medium tracking-[-0.02em] text-black flex items-center gap-2.5">
              <FileText className="h-7 w-7 text-amber-700" />
              <span>Reports & Case History</span>
            </h1>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE NASA FIRMS + DINOV3
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Dokumentasi berkas hasil investigasi AI, evaluasi kerusakan vegetasi DINOv3, dan ekspor PDF/GeoJSON langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportAllBundle}
            className="text-xs gap-1.5"
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            <span>Unduh Semua Berkas (JSON)</span>
          </Button>

          <Link href="/investigation">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Investigasi Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID kasus, wilayah, atau nama pemeriksa..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-600" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none"
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
      <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID Kasus</th>
                <th className="py-3 px-4">Wilayah Operasional</th>
                <th className="py-3 px-4">Tanggal Analisis</th>
                <th className="py-3 px-4">Pemeriksa / Satuan</th>
                <th className="py-3 px-4">Status Laporan</th>
                <th className="py-3 px-4 text-right">Format Ekspor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredReports.map((r) => {
                const isDraft = r.status === "Draft";
                const isCompleted = r.status === "Selesai";
                const isReviewed = r.status === "Ditinjau";

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-100 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-amber-700 text-xs">
                        {r.caseNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {r.id}
                      </div>
                    </td>

                    {/* Wilayah & Ringkasan */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900">
                        {r.region}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {r.summary}
                      </p>
                    </td>

                    {/* Tanggal */}
                    <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{r.date}</span>
                      </div>
                    </td>

                    {/* Pemeriksa */}
                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-medium">
                        {r.examiner}
                      </div>
                      {r.totalBurnedAreaHa && (
                        <div className="text-[11px] text-amber-700/90 font-medium">
                          Luas: {r.totalBurnedAreaHa.toLocaleString()} Ha
                          {r.priorityScore ? ` • Skor MCDA: ${r.priorityScore}/100` : ""}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          isDraft
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            : isCompleted
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : isReviewed
                            ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                            : "bg-slate-100 text-slate-600 border-slate-300"
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
                          disabled={exportingKey === `${r.caseNumber}:pdf`}
                          onClick={() => handleExport("pdf", r)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-300 hover:border-amber-500/50 hover:text-amber-700"
                          title="Unduh Laporan PDF Formal"
                        >
                          <FileText className="h-3.5 w-3.5 text-rose-700" />
                          <span>PDF</span>
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={exportingKey === `${r.caseNumber}:geojson`}
                          onClick={() => handleExport("geojson", r)}
                          className="h-8 px-2.5 text-xs gap-1 border-slate-300 hover:border-amber-500/50 hover:text-amber-700"
                          title="Ekspor Spasial GeoJSON (DINOv3 + FIRMS)"
                        >
                          <FileCode className="h-3.5 w-3.5 text-emerald-700" />
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
