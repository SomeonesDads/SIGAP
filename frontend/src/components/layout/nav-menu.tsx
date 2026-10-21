"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, Layers, Map, Menu, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { name: "Peta Pemantauan", href: "/", icon: Map },
  { name: "Investigasi AI", href: "/investigation", icon: Bot },
  { name: "Analisis Citra", href: "/map", icon: Layers },
  { name: "Penilaian Prioritas", href: "/priority", icon: ShieldAlert },
  { name: "Laporan & Riwayat", href: "/reports", icon: FileText },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Module menu opened from the navbar (not part of the Figma frames). */
export function NavMenu({ size = "desktop" }: { size?: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDesktop = size === "desktop";

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu modul"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center justify-center text-slate-800 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt",
          isDesktop ? "size-[50px] rounded-[10px]" : "size-[30px] rounded-md"
        )}
      >
        {open ? (
          <X className={isDesktop ? "size-[34px]" : "size-6"} strokeWidth={2.25} />
        ) : (
          <Menu className={isDesktop ? "size-[34px]" : "size-6"} strokeWidth={2.25} />
        )}
      </button>

      {open && (
        <nav className="absolute right-0 top-[calc(100%+10px)] z-[1200] w-72 overflow-hidden rounded-[20px] bg-slate-50 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.2)] ring-1 ring-slate-300">
          <p className="px-3 pb-2 pt-2 font-mono text-xs font-semibold uppercase tracking-wider text-slate-600">
            Modul SIGAP
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-mono text-[15px] font-medium transition-colors",
                  active ? "bg-sigap-cobalt text-white" : "text-slate-800 hover:bg-slate-200"
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
