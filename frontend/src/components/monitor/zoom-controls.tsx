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
    "flex cursor-pointer items-center justify-center bg-sigap-panel transition-colors hover:bg-[#cfcfcf] active:bg-[#c4c4c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt",
    isDesktop ? "size-[100px] rounded-[20px]" : "size-[60px] rounded-[10px]"
  );
  const icon = isDesktop ? "size-[53px]" : "size-[31.8px]";

  return (
    <div className={cn("flex flex-col", isDesktop ? "gap-[15px]" : "gap-[6px]", className)}>
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
