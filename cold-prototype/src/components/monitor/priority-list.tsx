import { Bot } from "lucide-react";
import { SEVERITY_META, type Hotspot } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

interface PriorityListProps {
  hotspots: Hotspot[];
  selectedId: string | null;
  onSelect: (hotspot: Hotspot) => void;
  onInvestigate?: (hotspot: Hotspot) => void;
  size?: "desktop" | "mobile";
}

/** "Hotspot Prioritas:" — top-ranked hotspots, each focusable on the map. */
export function PriorityList({
  hotspots,
  selectedId,
  onSelect,
  onInvestigate,
}: PriorityListProps) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Hotspot Prioritas Utama
        </h2>
        <span className="font-mono text-[10px] text-slate-500">
          Top {hotspots.length} MCDA
        </span>
      </div>
      <ol className="space-y-1">
        {hotspots.length === 0 && (
          <li className="text-xs text-slate-500 py-1">Tidak ada hotspot aktif.</li>
        )}
        {hotspots.map((h, idx) => {
          const active = selectedId === h.id;
          const meta = SEVERITY_META[h.severity];
          return (
            <li
              key={h.id}
              className={cn(
                "flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 transition-colors",
                active
                  ? "border-sigap-cobalt bg-sigap-cobalt/10"
                  : "border-slate-200/90 bg-white/90 hover:bg-slate-50"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(h)}
                aria-current={active}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left focus-visible:outline-none"
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900">
                    <span>{h.id}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({h.distanceKm}km • {h.etaMin}m)
                    </span>
                  </div>
                  <div className="truncate text-[10px] text-slate-600">
                    {h.location.split(",")[0]} • Skor {Math.round(h.riskScore)}
                  </div>
                </div>
              </button>

              {onInvestigate && (
                <button
                  type="button"
                  onClick={() => onInvestigate(h)}
                  title={`Investigasi ${h.id} dengan Agen AI`}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-1 text-[10px] font-medium text-amber-800 transition-colors hover:bg-amber-500/20"
                >
                  <Bot className="size-3" />
                  <span>AI</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
