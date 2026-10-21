import React from "react";
import { ReportList } from "@/components/reports/report-list";

export const metadata = {
  title: "Reports & Case History — SIGAP",
  description:
    "Daftar riwayat investigasi karhutla live NASA FIRMS + DINOv3, ringkasan bukti satelit, dan ekspor laporan format PDF serta GeoJSON.",
};

export default function ReportsPage() {
  return <ReportList />;
}
