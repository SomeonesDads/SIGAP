import React from "react";
import { MonitorDashboard } from "@/components/monitor/monitor-dashboard";

export const metadata = {
  title: "SIGAP — Unified Wildfire Command Center",
  description: "Visualisasi peta interaktif karhutla, chat investigasi AI, lapisan DINOv3, dNBR, dan komparasi satelit dalam satu layar.",
};

export default function FireMapPage() {
  return <MonitorDashboard />;
}
