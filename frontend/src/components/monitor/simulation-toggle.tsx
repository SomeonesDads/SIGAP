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
        "group flex shrink-0 cursor-pointer items-center rounded-full focus-visible:outline-none",
        isDesktop ? "gap-4" : "gap-1"
      )}
    >
      <span
        className={cn(
          "relative shrink-0 rounded-full transition-transform group-hover:scale-[1.03] group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-sigap-cobalt group-focus-visible:ring-offset-2",
          isDesktop ? "h-[50px] w-[100px]" : "h-[29px] w-[58px]"
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
          isDesktop ? "text-[24px] tracking-[-0.48px]" : "text-[15px] tracking-[-0.3px]"
        )}
      >
        Simulation mode
      </span>
    </button>
  );
}
