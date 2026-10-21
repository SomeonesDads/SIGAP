import React from "react";
import { PriorityTable } from "@/components/priority/priority-table";

export const metadata = {
  title: "Priority Assessment — SIGAP",
  description:
    "Penilaian prioritas respon karhutla berbasis multikriteria: kedalaman gambut, kedekatan pemukiman, dan estimasi keparahan terbakar.",
};

export default function PriorityPage() {
  return <PriorityTable />;
}
