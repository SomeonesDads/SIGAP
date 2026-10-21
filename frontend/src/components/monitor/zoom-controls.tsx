import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  size?: "desktop" | "mobile";
  className?: string;
}

/** Figma groups "Group 9" / "Group 10": zoom in & zoom out tiles. */
export function ZoomControls({ onZoomIn, onZoomOut, size = "desktop", className }: ZoomControlsProps) {
  const isDesktop = size === "desktop";
  const tile = cn(
    "flex cursor-pointer items-center justify-center border border-slate-300/80 bg-white/90 backdrop-blur-md shadow-md transition-colors hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt",
    isDesktop ? "size-8 rounded-lg" : "size-7 rounded-md"
  );
  const icon = isDesktop ? "size-4" : "size-3.5";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button type="button" onClick={onZoomIn} className={tile} aria-label="Perbesar peta" title="Perbesar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/zoom-in.svg" className={cn("block max-w-none", icon)} />
      </button>
      <button type="button" onClick={onZoomOut} className={tile} aria-label="Perkecil peta" title="Perkecil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/zoom-out.svg" className={cn("block max-w-none", icon)} />
      </button>
    </div>
  );
}
