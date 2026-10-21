import { SEVERITY_META, type Hotspot } from "@/lib/monitoring";

/** Pointer tip position inside popup-bg.svg (265.385 × 280). */
export const HOTSPOT_CARD_TIP = { x: 86.935, y: 280 } as const;

interface HotspotCardProps {
  hotspot: Hotspot;
  priorityRank: number;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="font-bold">{label}</dt>
      <dd className="font-normal">{value}</dd>
    </>
  );
}

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Figma "Frame 21": hotspot detail card shown above the selected marker. */
export function HotspotCard({ hotspot, priorityRank }: HotspotCardProps) {
  const meta = SEVERITY_META[hotspot.severity];

  return (
    <div className="relative h-[280px] w-[265.385px] text-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/figma/popup-bg.svg" className="absolute inset-0 block size-full max-w-none" />

      <div className="absolute left-[11px] top-[11px] w-[237px] font-sans">
        <div className="ml-[3px] flex w-[234px] items-start justify-between">
          <p className="text-[12px] font-bold leading-[1.4] tracking-[0.12px]">{hotspot.id}</p>
          <span
            className="flex h-[18px] items-center gap-1 rounded-[20px] px-1"
            style={{ backgroundColor: meta.surface }}
          >
            <span className="size-[10px] rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="text-[10px] font-medium leading-[1.4] tracking-[0.1px]">{meta.label}</span>
          </span>
        </div>
        <div className="ml-[2px] mt-[5px] h-px w-[234px] bg-black" />

        <p className="ml-[4px] mt-[4px] flex h-[20px] w-[233px] items-center rounded-[20px] bg-[rgba(217,119,6,0.08)] px-2 text-[10px] font-medium leading-[1.4] tracking-[0.1px]">
          Prioritas: #{priorityRank} · Skor risiko {fmt(hotspot.riskScore, 1)}
        </p>

        <div className="mt-[6px] flex w-[236px] flex-col gap-[2px] text-[9px] leading-[1.4] tracking-[0.09px]">
          <dl className="grid grid-cols-[84px_1fr] font-medium">
            <Row label="Luas" value={`${fmt(hotspot.areaHa)} ha`} />
            <Row label="dNBR rata-rata" value={fmt(hotspot.dnbrMean, 2)} />
            <Row label="Citra pra/pasca" value={hotspot.imagery} />
          </dl>
          <div className="h-px w-full bg-black" />
          <dl className="grid grid-cols-[84px_1fr]">
            <Row label="Lahan gambut" value={hotspot.peatland ? "Ya" : "Tidak"} />
            <Row label="Jarak permukiman" value={`${fmt(hotspot.settlementKm, 1)} km`} />
            <Row label="Status" value={hotspot.status} />
          </dl>
          <div className="h-px w-full bg-black" />
          <dl className="grid grid-cols-[43px_1fr] gap-y-[2px]">
            <Row label="Lokasi" value={hotspot.location} />
            <Row
              label="Catatan"
              value={
                <>
                  Tipe kebakaran: {hotspot.fireType}
                  <br />
                  Kondisi tanah: {hotspot.soil}
                  <br />
                  Kondisi terakhir: {hotspot.lastCondition}
                </>
              }
            />
          </dl>
          <div className="h-px w-full bg-black" />
          <p>
            <span className="font-bold">Sumber satelit </span>
            {hotspot.satellite}
          </p>
        </div>
      </div>
    </div>
  );
}
