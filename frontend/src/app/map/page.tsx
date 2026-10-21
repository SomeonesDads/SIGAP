import React from "react";
import { FireMapView } from "@/components/map/fire-map-view";

export const metadata = {
  title: "Fire Analysis Map — SIGAP",
  description: "Visualisasi peta interaktif karhutla, lapisan hotspot, segmentasi U-Net, dNBR, dan komparasi sebelum-sesudah.",
};

export default function FireMapPage() {
  return <FireMapView />;
}
