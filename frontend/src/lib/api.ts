import type { Investigation } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Guess the target region from a free-text prompt for the offline fallback. */
function guessRegion(query: string): string {
  const known = ["Pulang Pisau", "Ketapang", "Ogan Komering Ilir", "Sebangau", "Kapuas", "Riau", "Barito Utara"];
  return known.find((r) => query.toLowerCase().includes(r.toLowerCase())) ?? "Kalimantan Tengah";
}

/**
 * Start an autonomous investigation via `POST /api/investigations/`.
 * Falls back to a local stub when the backend is unreachable so the UI
 * stays usable during frontend-only development.
 */
export async function startInvestigation(query: string): Promise<Investigation> {
  try {
    const res = await fetch(`${API_URL}/api/investigations/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Investigation;
    return { ...data, region: data.region ?? guessRegion(query) };
  } catch {
    return {
      id: `local-${Date.now()}`,
      status: "running",
      query,
      region: guessRegion(query),
      created_at: new Date().toISOString(),
    };
  }
}
