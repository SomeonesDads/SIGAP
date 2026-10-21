import { Bot, X } from "lucide-react";
import { getHotspotEnvironment, SEVERITY_META, type Hotspot } from "@/lib/monitoring";

/** Pointer tip position for anchoring above the selected marker (width 244, height 246). */
export const HOTSPOT_CARD_TIP = { x: 122, y: 246 } as const;

interface HotspotCardProps {
  hotspot: Hotspot;
  priorityRank: number;
  onInvestigate?: (hotspot: Hotspot) => void;
  onClose?: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="font-medium text-slate-900 text-right truncate">{value}</dd>
    </div>
  );
}

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Compact hotspot detail card shown above the selected marker. */
export function HotspotCard({ hotspot, priorityRank, onInvestigate, onClose }: HotspotCardProps) {
  const meta = SEVERITY_META[hotspot.severity];
  const env = getHotspotEnvironment(hotspot);

  return (
    <div className="relative w-[244px] rounded-xl border border-slate-300 bg-white/95 p-2.5 text-slate-900 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold">{hotspot.id}</span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: meta.surface }}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} />
            <span>{meta.label}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-800">
            #{priorityRank} · {fmt(hotspot.riskScore, 1)}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Tutup kartu"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-1.5 space-y-1 text-[10px] leading-tight">
        <p className="truncate font-semibold text-slate-800" title={hotspot.location}>
          {hotspot.location}
        </p>
        <dl className="space-y-0.5 border-y border-slate-100 py-1">
          <Row label="Luas & dNBR" value={`${fmt(hotspot.areaHa)} ha · dNBR ${fmt(hotspot.dnbrMean, 2)}`} />
          <Row label="Radius Sebaran" value={`${fmt(env.majorAxisKm, 1)} × ${fmt(env.minorAxisKm, 1)} km`} />
          <Row label="Angin & Arah" value={`${env.windSpeedKmh} km/j → ${env.windDirectionLabel}`} />
          <Row label="Flamabilitas" value={`${Math.round(env.flammabilityIndex * 100)}% · ${hotspot.soil}`} />
          <Row label="Permukiman" value={`${fmt(hotspot.settlementKm, 1)} km · ETA ${hotspot.etaMin}m`} />
        </dl>

        {onInvestigate && (
          <button
            type="button"
            onClick={() => onInvestigate(hotspot)}
            className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 shadow-xs transition-colors hover:bg-amber-400"
          >
            <Bot className="size-3.5" />
            <span>Investigasi Klaster via AI</span>
          </button>
        )}
      </div>

      {/* Bottom pointer triangle */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rotate-45 border-b border-r border-slate-300 bg-white" />
    </div>
  );
}
