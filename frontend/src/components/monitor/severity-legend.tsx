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
        "rounded-[20px] bg-[rgba(217,217,217,0.75)] backdrop-blur-[2px]",
        isDesktop ? "p-8" : "flex justify-center p-4",
        className
      )}
    >
      <div className={cn("flex flex-col items-start", isDesktop ? "w-[436px] gap-6" : "w-[304px] gap-[10px]")}>
        <p
          className={cn(
            "font-mono font-medium leading-none text-black",
            isDesktop ? "text-[24px] tracking-[-0.48px]" : "text-[16px] tracking-[-0.32px]"
          )}
        >
          LEGENDA KEPARAHAN KEBAKARAN
        </p>
        <div
          className={cn(
            "grid",
            isDesktop ? "grid-cols-[156px_156px_auto]" : "grid-cols-[108px_108px_auto]"
          )}
        >
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
                  "flex w-fit cursor-pointer items-center gap-4 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt",
                  isHidden && "opacity-40 hover:opacity-60"
                )}
              >
                <span
                  className={cn("shrink-0 rounded-[5px]", isDesktop ? "size-6" : "size-4")}
                  style={{ backgroundColor: meta.color }}
                />
                <span
                  className={cn(
                    "whitespace-nowrap font-mono font-semibold leading-none text-black",
                    isDesktop ? "text-[24px] tracking-[-0.48px]" : "text-[16px] tracking-[-0.32px]",
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
