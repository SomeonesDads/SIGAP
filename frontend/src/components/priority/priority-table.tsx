"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Flame,
  Trees,
  Home,
  CheckCircle2,
  HelpCircle,
  Filter,
  ArrowDownToLine,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchMonitoringHotspots, getReportDownloadUrl } from "@/lib/api";
import type { Hotspot } from "@/lib/monitoring";

interface PriorityItem {
  id: string;
  location: string;
  district: string;
  coordinates: string;
  lat: number;
  lon: number;
  isPeatland: boolean;
  settlementKmNum: number;
  primaryFactor: string;
  score: number;
  recommendation: string;
  peatland: string;
  settlementDistance: string;
  hotspotsCount: number;
  burnSeverity: string;
  whyThisArea: {
    rationale: string;
    peatlandRisk: string;
    socialRisk: string;
    fireTrajectory: string;
    actionDirectives: string[];
  };
}

type CriteriaFilter = "all" | "critical" | "peatland" | "settlement";

function hotspotToPriorityItem(h: Hotspot, index: number): PriorityItem {
  const count = h.hotspotCount ?? 1;
  const frp = h.totalFrp ?? 25.0;
  const score = Math.round(h.riskScore);
  return {
    id: `PRIO-LIVE-${String(index + 1).padStart(2, "0")}`,
    location: h.location,
    district: h.district ?? "Kalimantan",
    coordinates: `${h.lat.toFixed(4)}°, ${h.lon.toFixed(4)}°`,
    lat: h.lat,
    lon: h.lon,
    isPeatland: Boolean(h.peatland),
    settlementKmNum: h.settlementKm,
    primaryFactor: h.peatland
      ? `Lahan Gambut (${h.soil}) & Klaster ${count} Titik Panas`
      : `Anomali Termal Aktif (${count} Hotspot, FRP ${frp} MW)`,
    score,
    recommendation:
      score >= 85
        ? `Prioritas ${index + 1}: Water Bombing Helikopter & Regu Manggala Agni Darat (ETA ${h.etaMin} mnt)`
        : `Prioritas ${index + 1}: Patroli Verifikasi Darat & Sekat Kanal (ETA ${h.etaMin} mnt)`,
    peatland: h.soil,
    settlementDistance: `${h.settlementKm} km`,
    hotspotsCount: count,
    burnSeverity: `${score >= 85 ? "Kritis" : score >= 70 ? "Tinggi" : "Sedang"} (dNBR ${h.dnbrMean})`,
    whyThisArea: {
      rationale: `Deteksi live ${h.satellite} (${h.imagery}) mengonfirmasi ${h.lastCondition} dengan estimasi cakupan ${h.areaHa} Ha dan skor risiko MCDA ${h.riskScore}/100.`,
      peatlandRisk: h.peatland
        ? `Berada pada kawasan ${h.soil} dengan tipe kebakaran ${h.fireType.toLowerCase()} yang berisiko memicu bara bawah permukaan (smoldering).`
        : `Berada pada tanah ${h.soil} dengan perambatan api permukaan pada vegetasi kering.`,
      socialRisk: `Jarak ke permukiman terdekat ${h.settlementKm} km; jarak tempuh tim darat terdekat ${h.distanceKm} km (~${h.etaMin} menit).`,
      fireTrajectory: `Radiasi termal klaster mencapai ${frp} MW pada area ~${h.areaHa} Ha (rata-rata dNBR ${h.dnbrMean}).`,
      actionDirectives: [
        `Kerahkan regu pemadam darat terdekat (jarak ${h.distanceKm} km, estimasi tiba ${h.etaMin} menit).`,
        h.peatland
          ? "Aktifkan pompa tekanan tinggi dan suntik gambut (peat spear) pada sekat kanal terdekat."
          : "Buat sekat bakar mekanis di perimeter luar klaster untuk memutus kepala api.",
        `Pantau pembaruan lintasan satelit ${h.satellite} berikutnya.`,
      ],
    },
  };
}

const PRIORITY_DATA: PriorityItem[] = [
  {
    id: "PRIO-01",
    location: "Kahayan Hilir, Klaster Gambut B",
    district: "Kab. Pulang Pisau, Kalteng",
    coordinates: "-2.9812°, 114.1205°",
    lat: -2.9812,
    lon: 114.1205,
    isPeatland: true,
    settlementKmNum: 0.85,
    primaryFactor: "Kubah Gambut Dalam (>3m) & Dekat Pemukiman",
    score: 95,
    recommendation: "Prioritas 1: Water bombing Helikopter & Regu Manggala Agni Darat",
    peatland: "Kubah Gambut Sangat Dalam",
    settlementDistance: "0.85 km",
    hotspotsCount: 18,
    burnSeverity: "Kritis (dNBR 0.74)",
    whyThisArea: {
      rationale:
        "Wilayah ini memiliki akumulasi skor risiko tertinggi (95/100). Hotspot berulang terpantau selama 48 jam berturut-turut pada hamparan gambut kering dengan potensi kebakaran bawah tanah (smoldering fire) yang sulit dipadamkan.",
      peatlandRisk:
        "Kedalaman gambut mencapai 3,5 meter dengan muka air tanah (MAT) di bawah -40 cm, menciptakan kondisi bahan bakar organik sangat rentan.",
      socialRisk:
        "Berjarak kurang dari 1 km dari Desa Mantaren I; arah angin barat-daya mendorong asap pekat langsung menuju fasilitas pendidikan dan jalur lintas trans-Kalimantan.",
      fireTrajectory:
        "Model perambatan api memprediksi perluasan 12 hektare/hari jika tidak dilakukan pembasahan segera.",
      actionDirectives: [
        "Kerahkan heli water bombing BPBD untuk pendinginan kubah utama (3 sorties).",
        "Regu darat Manggala Agni Daops Pulang Pisau membuat sekat bakar basah di sisi timur.",
        "Aktivasi sumur bor terdekat dan pompa jinjing submersible.",
      ],
    },
  },
];

export function PriorityTable() {
  const [items, setItems] = useState<PriorityItem[]>(PRIORITY_DATA);
  const [isLive, setIsLive] = useState(false);
  const [updatedAtLabel, setUpdatedAtLabel] = useState<string>("Memuat data satelit NRT...");
  const [expandedId, setExpandedId] = useState<string | null>("PRIO-01");
  const [criteriaFilter, setCriteriaFilter] = useState<CriteriaFilter>("all");

  useEffect(() => {
    let active = true;
    fetchMonitoringHotspots("Kalimantan", 10).then((res) => {
      if (!active || !res.hotspots.length) return;
      const mapped = res.hotspots.slice(0, 10).map(hotspotToPriorityItem);
      setItems(mapped);
      setIsLive(res.is_live);
      setExpandedId(mapped[0]?.id ?? null);

      const first = res.hotspots[0];
      if (first?.acqDate) {
        const hh = (first.acqTime ?? "0630").slice(0, 2);
        const mm = (first.acqTime ?? "0630").slice(2, 4);
        setUpdatedAtLabel(`Akuisisi NASA FIRMS: ${first.acqDate} ${hh}:${mm} UTC`);
      } else {
        setUpdatedAtLabel(
          `Diperbarui: ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (criteriaFilter === "critical") return item.score >= 85;
      if (criteriaFilter === "peatland") return item.isPeatland;
      if (criteriaFilter === "settlement") return item.settlementKmNum <= 3.0;
      return true;
    });
  }, [items, criteriaFilter]);

  const criticalCount = useMemo(
    () => items.filter((i) => i.score >= 85).length,
    [items]
  );
  const peatlandCount = useMemo(
    () => items.filter((i) => i.isPeatland).length,
    [items]
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDownloadCSV = () => {
    const headers = [
      "ID",
      "Lokasi",
      "Wilayah",
      "Koordinat",
      "Skor_MCDA",
      "Jumlah_Hotspot",
      "Karakteristik_Tanah",
      "Jarak_Permukiman",
      "Keparahan_dNBR",
      "Rekomendasi_Tindakan",
    ];
    const escapeCsv = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`;

    const rows = filteredItems.map((i) =>
      [
        i.id,
        i.location,
        i.district,
        i.coordinates,
        i.score,
        i.hotspotsCount,
        i.peatland,
        i.settlementDistance,
        i.burnSeverity,
        i.recommendation,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Priority_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDirectivePdf = (item: PriorityItem) => {
    const url = getReportDownloadUrl(item.id, item.lat, item.lon);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIGAP_Directive_${item.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-medium tracking-[-0.02em] text-black flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-amber-700" />
            <span>Priority Assessment & Response Matrix</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Penentuan urutan prioritas verifikasi lapangan, pemadaman darat (Manggala Agni), dan alokasi water bombing (BPBD).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-600" />
            <select
              value={criteriaFilter}
              onChange={(e) => setCriteriaFilter(e.target.value as CriteriaFilter)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none"
              aria-label="Filter Kriteria Prioritas"
            >
              <option value="all">Semua Kriteria ({items.length})</option>
              <option value="critical">Prioritas Kritis ≥ 85 ({criticalCount})</option>
              <option value="peatland">Khusus Lahan Gambut ({peatlandCount})</option>
              <option value="settlement">Dekat Pemukiman ≤ 3 km</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadCSV}
            className="text-xs gap-1.5"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>Unduh Matriks (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Priority Summary Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span>
            <strong>Perhatian Operasional:</strong>{" "}
            <strong>{criticalCount} zona</strong> berada dalam kategori{" "}
            <strong>Prioritas Kritis/Tinggi</strong> ({peatlandCount} zona berada pada ekosistem gambut rawan bara bawah permukaan).
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
          {updatedAtLabel}
        </span>
      </div>

      {/* Table Container */}
      <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-700" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Matriks Penilaian Prioritas Intervensi Karhutla
            </h3>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE NASA FIRMS + OSM
              </span>
            )}
          </div>
          <span className="text-xs text-slate-600">
            Menampilkan {filteredItems.length} dari {items.length} klaster aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Detail</th>
                <th className="py-3 px-4">Lokasi & Wilayah</th>
                <th className="py-3 px-4">Faktor Utama Risiko</th>
                <th className="py-3 px-4 text-center">Skor Prioritas</th>
                <th className="py-3 px-4">Rekomendasi Tindakan</th>
                <th className="py-3 px-4 text-right">Indikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredItems.map((item) => {
                const isExpanded = expandedId === item.id;
                const isCritical = item.score >= 90;
                const isHigh = item.score >= 80 && item.score < 90;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? "bg-slate-100" : "hover:bg-slate-100"
                      }`}
                    >
                      {/* Expand Chevron */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          className="p-1 text-slate-600 hover:text-amber-700 rounded"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-amber-700" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{item.location}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {item.district}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.coordinates}
                        </div>
                      </td>

                      {/* Faktor Utama */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block">
                          {item.primaryFactor}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Trees className="h-3 w-3 text-emerald-700" />
                            {item.peatland}
                          </span>
                        </div>
                      </td>

                      {/* Skor */}
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-full text-xs border ${
                            isCritical
                              ? "bg-rose-500/20 text-rose-700 border-rose-500/40"
                              : isHigh
                              ? "bg-amber-500/20 text-amber-700 border-amber-500/40"
                              : "bg-blue-500/20 text-blue-700 border-blue-500/40"
                          }`}
                        >
                          {item.score} / 100
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500 mt-1">
                          {isCritical ? "Kritis" : isHigh ? "Tinggi" : "Sedang"}
                        </div>
                      </td>

                      {/* Rekomendasi */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-slate-700 font-medium">
                          {item.recommendation}
                        </p>
                      </td>

                      {/* Indikator Metrik */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-[11px] text-slate-700 font-medium">
                          {item.hotspotsCount} Titik Panas
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.settlementDistance} ke pemukiman
                        </div>
                      </td>
                    </tr>

                    {/* 'Why This Area?' Expandable Section */}
                    {isExpanded && (
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <td colSpan={6} className="p-5">
                          <div className="rounded-xl border border-amber-500/30 bg-white p-4 space-y-4">
                            {/* Expandable Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-amber-700" />
                                <h4 className="text-sm font-semibold text-amber-700">
                                  Why This Area? — Analisis Pertimbangan AI & Dampak Lapangan
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-600">
                                Kasus Referensi: {item.id}
                              </span>
                            </div>

                            {/* Rationale explanation */}
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {item.whyThisArea.rationale}
                            </p>

                            {/* 3 Detail Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                              <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                                  <Trees className="h-3.5 w-3.5" />
                                  <span>Karakteristik Lahan & Gambut</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-normal">
                                  {item.whyThisArea.peatlandRisk}
                                </p>
                              </div>

                              <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 mb-1">
                                  <Home className="h-3.5 w-3.5" />
                                  <span>Dampak Sosial & Permukiman</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-normal">
                                  {item.whyThisArea.socialRisk}
                                </p>
                              </div>

                              <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 mb-1">
                                  <Flame className="h-3.5 w-3.5" />
                                  <span>Prediksi Jalur & Kecepatan Api</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-normal">
                                  {item.whyThisArea.fireTrajectory}
                                </p>
                              </div>
                            </div>

                            {/* Action Directives for Field Teams */}
                            <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block mb-2">
                                Instruksi Tindakan Operasional Tim Lapangan:
                              </span>
                              <div className="space-y-1.5">
                                {item.whyThisArea.actionDirectives.map(
                                  (directive, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2 text-xs text-slate-700"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                      <span>{directive}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Direct Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadDirectivePdf(item);
                                }}
                              >
                                Unduh Petunjuk Lapangan (PDF)
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-xs font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/investigation?q=Lakukan+investigasi+mendalam+untuk+wilayah+${encodeURIComponent(item.location)}`;
                                }}
                              >
                                Investigasi Mendalam via AI Workspace →
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
