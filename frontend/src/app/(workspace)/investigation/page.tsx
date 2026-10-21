"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MonitorDashboard } from "@/components/monitor/monitor-dashboard";

function InvestigationLauncher() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  return <MonitorDashboard initialQuery={q} />;
}

export default function InvestigationPage() {
  return (
    <Suspense fallback={<MonitorDashboard />}>
      <InvestigationLauncher />
    </Suspense>
  );
}
