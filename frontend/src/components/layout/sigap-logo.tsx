import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SigapLogoProps {
  size?: "desktop" | "mobile";
  className?: string;
}

/** SIGAP shield mark + wordmark (Figma: navbar/desktop, navbar/mobile). */
export function SigapLogo({ size = "desktop", className }: SigapLogoProps) {
  const isDesktop = size === "desktop";

  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-4", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden",
          isDesktop ? "h-[58px] w-[54px]" : "h-[43px] w-[40px]"
        )}
      >
        {/* Crop mirrors the Figma image fill of the generated logo */}
        <span className="absolute left-[-41.47%] top-[-35.54%] h-[169.26%] w-[183.02%]">
          <Image
            src="/figma/logo-sigap.png"
            alt="Logo SIGAP"
            fill
            sizes={isDesktop ? "99px" : "74px"}
            priority
          />
        </span>
      </span>
      <span
        className={cn(
          "font-display font-bold leading-[1.2] text-black",
          isDesktop ? "text-[48px] tracking-[1.2px]" : "text-[36px] tracking-[0.9px]"
        )}
      >
        SIGAP
      </span>
    </Link>
  );
}
