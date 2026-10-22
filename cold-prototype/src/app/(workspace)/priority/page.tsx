import React from "react";
import { MonitorDashboard } from "@/components/monitor/monitor-dashboard";

export const metadata = {
  title: "SIGAP — Unified Wildfire Command Center",
  description: "Penilaian prioritas respon karhutla MCDA, peta interaktif, dan konsol investigasi AI dalam satu layar.",
};

export default function PriorityPage() {
  return <MonitorDashboard initialDrawer="priority" />;
}
