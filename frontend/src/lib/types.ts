export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface InvestigationStep {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  timestamp?: string;
}

export interface DecisionLogEntry {
  id: string;
  step: string;
  decision: string;
  reasoning: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  steps?: InvestigationStep[];
  decisionLogs?: DecisionLogEntry[];
}

/** Mirrors backend `InvestigationResponse` (backend/models/investigation.py). */
export interface Investigation {
  id: string;
  status: string;
  query: string;
  region: string | null;
  created_at: string;
  updated_at?: string | null;
  results?: Record<string, unknown> | null;
}

export type ReportStatus = "Draft" | "Ditinjau" | "Selesai" | "Arsip";

export interface Report {
  id: string;
  caseNumber: string;
  region: string;
  date: string;
  status: ReportStatus;
  examiner: string;
  summary: string;
  totalBurnedAreaHa?: number;
  priorityScore?: number;
  exportFormats: ("pdf" | "geojson")[];
}
