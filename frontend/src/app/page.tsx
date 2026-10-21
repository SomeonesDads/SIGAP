import React from "react";
import Link from "next/link";
import {
  Flame,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  MapPin,
  FileCheck,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { MapContainer } from "@/components/map/map-container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvestigationLauncher } from "@/components/dashboard/investigation-launcher";

export default function DashboardPage() {
  const recentCases = [
    {
      id: "SIGAP-2026-089",
      region: "Pulang Pisau, Kalimantan Tengah",
      date: "21 Okt 2026",
      status: "Investigasi Berjalan",
      statusType: "warning",
      burnedEst: "1,240 Ha",
      priority: "Kritis",
      examiner: "Agen AI (Manggala Agni)",
    },
    {
      id: "SIGAP-2026-088",
      region: "Ketapang, Kalimantan Barat",
      date: "20 Okt 2026",
      status: "Selesai — Laporan Siap",
      statusType: "success",
      burnedEst: "890 Ha",
      priority: "Tinggi",
      examiner: "BPBD Kalbar",
    },
    {
      id: "SIGAP-2026-087",
      region: "Ogan Komering Ilir, Sumatera Selatan",
      date: "19 Okt 2026",
      status: "Ditinjau Petugas",
      statusType: "info",
      burnedEst: "420 Ha",
      priority: "Sedang",
      examiner: "KPH Wilayah II",
    },
    {
      id: "SIGAP-2026-086",
      region: "Sebangau, Kalimantan Tengah",
      date: "18 Okt 2026",
      status: "Selesai — Terarsip",
      statusType: "neutral",
      burnedEst: "1,300 Ha",
      priority: "Kritis",
      examiner: "Balai TN Sebangau",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Dashboard — Wildfire Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ringkasan pemantauan terpadu anomali termal, estimasi luasan area terbakar, dan respon prioritas lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Update satelit: 15 menit lalu</span>
          </div>
          <Link href="/investigation">
            <Button variant="primary" size="sm">
              <span>Buka AI Workspace</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Natural Language AI Investigation Prompt Launcher */}
      <InvestigationLauncher />

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Hotspot Terdeteksi"
          value="142"
          subtitle="titik aktif (24 Jam)"
          icon={<Flame className="h-6 w-6 text-amber-400" />}
          variant="warning"
          trend={{
            value: "+18%",
            isPositive: false,
            label: "vs 24 jam sebelumnya",
          }}
        />

        <StatCard
          title="Area Terindikasi"
          value="3,850"
          subtitle="Hektare (U-Net est.)"
          icon={<Layers className="h-6 w-6 text-cyan-400" />}
          variant="info"
          trend={{
            value: "2,100 Ha",
            isPositive: false,
            label: "di Lahan Gambut",
          }}
        />

        <StatCard
          title="Prioritas Tinggi"
          value="5"
          subtitle="zona intervensi"
          icon={<AlertTriangle className="h-6 w-6 text-rose-400" />}
          variant="danger"
          trend={{
            value: "2 Zona",
            isPositive: false,
            label: "< 1.5 km dari permukiman",
          }}
        />
      </div>

      {/* Grid: Interactive Map Placeholder + Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-semibold text-slate-200">
                Peta Sebaran Spasial Terkini
              </h2>
            </div>
            <Link
              href="/map"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              Lihat Peta Lengkap
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <MapContainer
            height="h-[420px]"
            title="Overview Sebaran Hotspot & Klaster Karhutla"
            activeLayers={["Hotspots FIRMS", "Kanal Gambut", "Buffer Permukiman"]}
          />
        </div>

        {/* Quick Priority Summary Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              <h2 className="text-base font-semibold text-slate-200">
                Area Butuh Verifikasi Cepat
              </h2>
            </div>
            <Link
              href="/priority"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Semua
            </Link>
          </div>

          <Card className="p-4 space-y-3 bg-slate-900/90 border-slate-800">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-300 text-sm">
                  Klaster Pulang Pisau Selatan
                </span>
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                  SKOR 94
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Lahan gambut dalam (>3m) dengan 14 titik panas terpusat, berjarak 800 meter dari permukiman warga.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rekomendasi: Water bombing & patroli darat</span>
                <Link
                  href="/priority"
                  className="text-amber-400 hover:underline"
                >
                  Detail →
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 text-sm">
                  Klaster Ketapang Barat
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  SKOR 82
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Indikasi kebakaran meluas ke area konsesi hutan tanaman industri. Citra dNBR menunjukkan kerusakan vegetasi sedang.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rekomendasi: Pembuatan sekat bakar</span>
                <Link
                  href="/priority"
                  className="text-amber-400 hover:underline"
                >
                  Detail →
                </Link>
              </div>
            </div>

            <div className="pt-1">
              <Link href="/priority" className="w-full">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Buka Matriks Penilaian Prioritas
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Cases List Placeholder */}
      <Card className="p-0 overflow-hidden border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-slate-200 text-sm">
              Riwayat Investigasi Kasus Terakhir
            </h2>
          </div>
          <Link
            href="/reports"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            Lihat Semua Laporan
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kasus ID</th>
                <th className="py-3 px-4">Wilayah Operasional</th>
                <th className="py-3 px-4">Tanggal Analisis</th>
                <th className="py-3 px-4">Estimasi Luas</th>
                <th className="py-3 px-4">Tingkat Prioritas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-amber-400">
                    {c.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{c.region}</div>
                    <div className="text-[11px] text-slate-500">{c.examiner}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{c.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {c.burnedEst}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.priority === "Kritis"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : c.priority === "Tinggi"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${
                        c.statusType === "warning"
                          ? "text-amber-400 bg-amber-500/10"
                          : c.statusType === "success"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-slate-400 bg-slate-800"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/reports"
                      className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-0.5"
                    >
                      Buka Kasus
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
