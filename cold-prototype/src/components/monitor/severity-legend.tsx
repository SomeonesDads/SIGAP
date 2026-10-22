import { SEVERITY_META, type Severity } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

const ORDER: Severity[] = ["tinggi", "sedang", "rendah"];

interface SeverityLegendProps {
  size?: "desktop" | "mobile";
  /** Severities currently hidden from the map. */
  hidden: Set<Severity>;
  onToggle: (severity: Severity) => void;
  className?: string;
}

/** Figma component "Legend/desktop" — each entry also filters the map. */
export function SeverityLegend({ size = "desktop", hidden, onToggle, className }: SeverityLegendProps) {
  const isDesktop = size === "desktop";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-300/80 bg-white/90 backdrop-blur-md shadow-md",
        isDesktop ? "px-3 py-2" : "px-2.5 py-1.5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={cn(
            "font-mono font-bold uppercase tracking-wider text-slate-700",
            isDesktop ? "text-[10px]" : "text-[9px]"
          )}
        >
          Keparahan:
        </span>
        <div className="flex items-center gap-2">
          {ORDER.map((severity) => {
            const meta = SEVERITY_META[severity];
            const isHidden = hidden.has(severity);
            return (
              <button
                key={severity}
                type="button"
                aria-pressed={!isHidden}
                title={isHidden ? `Tampilkan hotspot ${meta.label}` : `Sembunyikan hotspot ${meta.label}`}
                onClick={() => onToggle(severity)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sigap-cobalt",
                  isHidden
                    ? "border-slate-200 bg-slate-50 opacity-45"
                    : "border-slate-200 bg-white shadow-2xs"
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: meta.color }}
                />
                <span
                  className={cn(
                    "whitespace-nowrap font-mono text-[11px] font-semibold leading-none text-slate-800",
                    isHidden && "line-through"
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
