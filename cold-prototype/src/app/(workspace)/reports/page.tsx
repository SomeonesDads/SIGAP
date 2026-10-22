import React from "react";
import { MonitorDashboard } from "@/components/monitor/monitor-dashboard";

export const metadata = {
  title: "SIGAP — Unified Wildfire Command Center",
  description: "Daftar riwayat investigasi karhutla live NASA FIRMS + DINOv3, peta interaktif, dan konsol AI dalam satu layar.",
};

export default function ReportsPage() {
  return <MonitorDashboard initialDrawer="reports" />;
}
