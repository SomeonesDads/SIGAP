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
    <p className="whitespace-nowrap font-mono text-[20px] leading-none tracking-[-0.4px] text-black">
      <span className="font-bold">{label}:</span> <span className="font-medium">{value}</span>
    </p>
  );
}

const pill =
  "h-10 cursor-pointer rounded-[10px] px-[15px] font-mono text-[24px] font-medium leading-none tracking-[-0.48px] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt focus-visible:ring-offset-2";

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
    <section>
      <h2 className="font-mono text-[24px] font-medium leading-none tracking-[-0.48px] text-black">
        Status Drone:
      </h2>

      <div className="mt-4 flex flex-wrap gap-3" role="tablist" aria-label="Pilih drone">
        {drones.map((d) => {
          const active = d.id === drone.id;
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectDrone(d.id)}
              className={cn(
                pill,
                "min-w-32",
                active ? "bg-sigap-cobalt hover:bg-[#0f63bd]" : "bg-sigap-cobalt/40 hover:bg-sigap-cobalt/60"
              )}
            >
              {d.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field label="GPS coord" value={`${drone.lat.toFixed(4)}, ${drone.lon.toFixed(4)}`} />
        <Field label="Mode" value={drone.targetId && drone.mode !== "Siaga" ? `${drone.mode} (${drone.targetId})` : drone.mode} />
        <Field label="Battery" value={`${Math.round(drone.battery)}%`} />
        <Field label="Extinguisher" value={`${Math.round(drone.extinguisherL)}/${drone.extinguisherCapacityL} L`} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canAssign}
          onClick={() => selectedHotspot && onAssign(drone.id, selectedHotspot.id)}
          className={cn(
            pill,
            "bg-sigap-cobalt text-[18px] hover:bg-[#0f63bd] disabled:cursor-not-allowed disabled:bg-sigap-cobalt/40"
          )}
        >
          {selectedHotspot ? `Tugaskan ke ${selectedHotspot.id}` : "Pilih hotspot di peta"}
        </button>
        <button
          type="button"
          disabled={drone.mode === "Siaga" || drone.mode === "Kembali ke base"}
          onClick={() => onRecall(drone.id)}
          className={cn(
            pill,
            "border-2 border-sigap-cobalt bg-transparent text-[18px] text-sigap-cobalt hover:bg-sigap-cobalt/10 disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          Kembali ke base
        </button>
      </div>
    </section>
  );
}
