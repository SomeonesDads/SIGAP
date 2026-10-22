import type { Drone, Hotspot } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

interface DroneStatusProps {
  drones: Drone[];
  activeDroneId: string;
  onSelectDrone: (id: string) => void;
  selectedHotspot: Hotspot | null;
  onAssign: (droneId: string, hotspotId: string) => void;
  onRecall: (droneId: string) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[11px] leading-tight text-slate-800">
      <span className="text-slate-500">{label}:</span>
      <span className="truncate font-semibold text-slate-900">{value}</span>
    </div>
  );
}

const pill =
  "h-6 cursor-pointer rounded-md px-2 font-mono text-[11px] font-semibold leading-none text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sigap-cobalt";

/** "Status Drone:" block, only shown in simulation mode. */
export function DroneStatus({
  drones,
  activeDroneId,
  onSelectDrone,
  selectedHotspot,
  onAssign,
  onRecall,
}: DroneStatusProps) {
  const drone = drones.find((d) => d.id === activeDroneId) ?? drones[0];
  if (!drone) return null;

  const canAssign = selectedHotspot !== null && selectedHotspot.id !== drone.targetId;

  return (
    <section className="space-y-2 border-t border-slate-200 pt-2.5">
      <div className="flex items-center justify-between gap-1">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 shrink-0">
          5 Drone Aktif
        </h2>
        <div className="flex items-center gap-1" role="tablist" aria-label="Pilih drone">
          {drones.map((d) => {
            const active = d.id === drone.id;
            const shortLabel = d.name.replace(/^Drone\s+/i, "");
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                title={`${d.name} (${d.mode})`}
                aria-selected={active}
                onClick={() => onSelectDrone(d.id)}
                className={cn(
                  "h-5 min-w-[22px] cursor-pointer rounded px-1.5 font-mono text-[10px] font-bold leading-none text-white transition-colors",
                  active
                    ? "bg-sigap-cobalt ring-1 ring-sigap-cobalt/40 hover:bg-[#0f63bd]"
                    : d.mode === "Memadamkan"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-slate-400 hover:bg-slate-500"
                )}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 rounded-lg border border-slate-200 bg-white/90 p-2">
        <Field
          label="Unit"
          value={`${drone.name} · Padam: ${drone.extinguishedCount ?? 0} klaster`}
        />
        {drone.baseName && <Field label="Asal" value={drone.baseName} />}
        <Field label="GPS" value={`${drone.lat.toFixed(3)}, ${drone.lon.toFixed(3)}`} />
        <Field
          label="Mode"
          value={
            drone.targetId && drone.mode !== "Siaga"
              ? `${drone.mode} (${drone.targetId})`
              : drone.mode
          }
        />
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Field label="Baterai" value={`${Math.round(drone.battery)}%`} />
          <Field
            label="Payload"
            value={`${Math.round(drone.extinguisherL)}/${drone.extinguisherCapacityL}L`}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canAssign}
          onClick={() => selectedHotspot && onAssign(drone.id, selectedHotspot.id)}
          className={cn(
            pill,
            "flex-1 bg-sigap-cobalt hover:bg-[#0f63bd] disabled:cursor-not-allowed disabled:bg-slate-300"
          )}
        >
          {selectedHotspot ? `Tugaskan → ${selectedHotspot.id}` : "Pilih hotspot"}
        </button>
        <button
          type="button"
          disabled={drone.mode === "Siaga" || drone.mode === "Kembali ke base"}
          onClick={() => onRecall(drone.id)}
          className={cn(
            pill,
            "border border-sigap-cobalt bg-white text-sigap-cobalt hover:bg-sigap-cobalt/10 disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          Recall
        </button>
      </div>
    </section>
  );
}
