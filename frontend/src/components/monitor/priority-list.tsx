import type { Hotspot } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

interface PriorityListProps {
  hotspots: Hotspot[];
  selectedId: string | null;
  onSelect: (hotspot: Hotspot) => void;
  size?: "desktop" | "mobile";
}

/** "Hotspot Prioritas:" — top-ranked hotspots, each focusable on the map. */
export function PriorityList({ hotspots, selectedId, onSelect, size = "desktop" }: PriorityListProps) {
  const isDesktop = size === "desktop";

  return (
    <section>
      <h2 className="font-mono text-[24px] font-medium leading-none tracking-[-0.48px] text-black">
        Hotspot Prioritas:
      </h2>
      <ol
        className={cn(
          "list-decimal text-black",
          isDesktop
            ? "mt-3 font-mono text-[24px] font-medium"
            : "mt-[18px] font-sans text-[16px] font-semibold tracking-[-0.16px]"
        )}
      >
        {hotspots.length === 0 && (
          <li className="list-none text-base font-normal text-slate-600">Tidak ada hotspot aktif.</li>
        )}
        {hotspots.map((h) => (
          <li key={h.id} className={isDesktop ? "ms-9" : "ms-6"}>
            <button
              type="button"
              onClick={() => onSelect(h)}
              aria-current={selectedId === h.id}
              className={cn(
                "-mx-1.5 cursor-pointer whitespace-nowrap rounded-md px-1.5 text-left transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt",
                isDesktop ? "leading-[2]" : "leading-[1.4]",
                selectedId === h.id && "text-sigap-cobalt underline underline-offset-4"
              )}
            >
              {h.id} ({h.distanceKm}km) - {h.etaMin}min
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
