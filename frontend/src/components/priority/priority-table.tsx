"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Trees,
  Home,
  CheckCircle2,
  HelpCircle,
  FileText,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PriorityItem {
  id: string;
  location: string;
  district: string;
  coordinates: string;
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

const PRIORITY_DATA: PriorityItem[] = [
  {
    id: "PRIO-01",
    location: "Kahayan Hilir, Klaster Gambut B",
    district: "Kab. Pulang Pisau, Kalteng",
    coordinates: "-2.9812°, 114.1205°",
    primaryFactor: "Kubah Gambut Dalam (>3m) & Dekat Pemukiman",
    score: 95,
    recommendation: "Prioritas 1: Water bombing Helikopter & Regu Manggala Agni Darat",
    peatland: "Kubah Gambut Sangat Dalam",
    settlementDistance: "850 meter",
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
  {
    id: "PRIO-02",
    location: "Kecamatan Kendawangan",
    district: "Kab. Ketapang, Kalbar",
    coordinates: "-2.7419°, 110.2311°",
    primaryFactor: "Konsentrasi Hotspot Cepat & Arah Angin Kencang",
    score: 86,
    recommendation: "Prioritas 2: Penyekatan Sekat Bakar & Patroli Drone Termal",
    peatland: "Gambut Dangkal / Mineral",
    settlementDistance: "2.1 km",
    hotspotsCount: 11,
    burnSeverity: "Tinggi (dNBR 0.58)",
    whyThisArea: {
      rationale:
        "Deteksi klaster aktif NASA FIRMS VIIRS menunjukkan peningkatan intensitas radiasi termal (FRP rata-rata 38 MW). Mengancam batas kawasan suaka satwa di sisi barat.",
      peatlandRisk:
        "Dominasi tanah aluvial dengan selingan gambut dangkal (0.5 - 1m); perambatan permukaan berlangsung cepat akibat vegetasi semak pakis kering.",
      socialRisk:
        "Jarak ke permukiman terdekat 2.1 km, namun berisiko memutus jalur akses logistik antar-desa jika api melompati parit perkebunan.",
      fireTrajectory:
        "Kecepatan angin 18 km/jam mengarah ke barat laut berpotensi melompati batas kanal buatan.",
      actionDirectives: [
        "Patroli udara menggunakan drone termal untuk memetakan kepala api (head fire).",
        "Mobilisasi tim gabungan MPA (Masyarakat Peduli Api) untuk pemadaman batas sisi kiri.",
      ],
    },
  },
  {
    id: "PRIO-03",
    location: "Tulung Selapan",
    district: "Kab. Ogan Komering Ilir, Sumsel",
    coordinates: "-3.3102°, 105.1843°",
    primaryFactor: "Area Gambut Kering Bekas Terbakar 2019",
    score: 81,
    recommendation: "Prioritas 3: Penggenangan Sekat Kanal & Penjagaan Posko",
    peatland: "Kubah Gambut Sedang",
    settlementDistance: "3.4 km",
    hotspotsCount: 7,
    burnSeverity: "Sedang (dNBR 0.44)",
    whyThisArea: {
      rationale:
        "Pola spasial mengindikasikan pembukaan lahan atau kebakaran ulang pada areal restorasi gambut. Potensi asap tebal mengganggu koridor penerbangan regional.",
      peatlandRisk:
        "Tinggi muka air tanah menunjukkan defisit hidrologis akibat saluran drainase yang belum tersekat sempurna.",
      socialRisk:
        "Jarak 3.4 km dari pusat desa, namun emisi karbon dan kabut asap pekat berdampak lintas batas kabupaten.",
      fireTrajectory:
        "Perambatan lambat namun konsisten di lapisan bawah permukaan.",
      actionDirectives: [
        "Tutup pintu air sekat kanal BRGM nomor SK-04 untuk menaikkan tinggi muka air.",
        "Lakukan verifikasi darat oleh regu patroli mandiri.",
      ],
    },
  },
  {
    id: "PRIO-04",
    location: "Zona Penyangga TN Sebangau",
    district: "Kab. Katingan, Kalteng",
    coordinates: "-2.4511°, 113.6214°",
    primaryFactor: "Perbatasan Kawasan Konservasi Keanekaragaman Hayati",
    score: 74,
    recommendation: "Prioritas 4: Patroli Verifikasi Lapangan & Monitoring Satelit Harian",
    peatland: "Hutan Rawa Gambut",
    settlementDistance: "5.8 km",
    hotspotsCount: 4,
    burnSeverity: "Rendah-Sedang (dNBR 0.32)",
    whyThisArea: {
      rationale:
        "Titik panas terdeteksi di tepi zona penyangga taman nasional. Walaupun intensitas belum kritis, nilai ekologis kawasan konservasi sangat tinggi.",
      peatlandRisk:
        "Ekosistem hutan rawa gambut alami dengan kanopi pohon yang masih cukup lebat.",
      socialRisk:
        "Jauh dari permukiman padat penduduk, fokus mitigasi adalah perlindungan habitat flora/fauna endemik.",
      fireTrajectory:
        "Titik api masih bersifat titik acak (spot fires), belum menyatu menjadi front api besar.",
      actionDirectives: [
        "Kirim tim patroli polhut balai taman nasional untuk ground-check koordinat.",
        "Jadwalkan akuisisi Landsat/Sentinel resolusi tinggi 24 jam ke depan.",
      ],
    },
  },
];

export function PriorityTable() {
  const [expandedId, setExpandedId] = useState<string | null>("PRIO-01");

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-700" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Matriks Penilaian Prioritas Intervensi Karhutla
            </h3>
          </div>
          <span className="text-xs text-slate-600">
            Diurutkan berdasarkan skor kerentanan multikriteria
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
              {PRIORITY_DATA.map((item) => {
                const isExpanded = expandedId === item.id;
                const isCritical = item.score >= 90;
                const isHigh = item.score >= 80 && item.score < 90;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded
                          ? "bg-slate-100"
                          : "hover:bg-slate-100"
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
                                  alert(`Menyimpan petunjuk lapangan ${item.id} ke arsip operasional.`);
                                }}
                              >
                                Simpan Petunjuk Lapangan
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
