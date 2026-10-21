import { cn } from "@/lib/utils";

interface SimulationToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "desktop" | "mobile";
}

/** Figma component "toggle" (38:1942) with its on/off variants. */
export function SimulationToggle({ checked, onChange, size = "desktop" }: SimulationToggleProps) {
  const isDesktop = size === "desktop";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex shrink-0 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 transition-colors hover:bg-slate-50 focus-visible:outline-none",
        isDesktop ? "gap-2 h-8" : "gap-1.5 h-7"
      )}
    >
      <span
        className={cn(
          "relative shrink-0 rounded-full transition-transform group-hover:scale-[1.03] group-active:scale-95",
          isDesktop ? "h-[18px] w-[36px]" : "h-[16px] w-[32px]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={checked ? "/figma/toggle-on.svg" : "/figma/toggle-off.svg"}
          className="absolute inset-0 block size-full max-w-none"
        />
      </span>
      <span
        className={cn(
          "whitespace-nowrap font-mono font-semibold leading-none text-slate-800",
          isDesktop ? "text-xs" : "text-[11px]"
        )}
      >
        Simulasi Drone
      </span>
    </button>
  );
}
