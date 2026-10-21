"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Map,
  ShieldAlert,
  FileText,
  Flame,
  Radio,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: undefined,
  },
  {
    name: "AI Investigation",
    href: "/investigation",
    icon: Bot,
    badge: "AI Agent",
  },
  {
    name: "Fire Map",
    href: "/map",
    icon: Map,
    badge: undefined,
  },
  {
    name: "Priority Assessment",
    href: "/priority",
    icon: ShieldAlert,
    badge: "3 Area",
  },
  {
    name: "Reports & History",
    href: "/reports",
    icon: FileText,
    badge: undefined,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top navigation toggle bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
            <Flame className="h-5 w-5 fill-amber-500/20" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-wide text-base">SIGAP</span>
            <span className="text-[10px] text-amber-400 block -mt-1 font-mono">AGEN KARHUTLA</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col justify-between border-r border-slate-800 bg-slate-950/95 p-4 backdrop-blur-md transition-transform duration-200 lg:static lg:flex lg:translate-x-0",
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Flame className="h-6 w-6 fill-slate-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-amber-400 transition-colors">
                  SIGAP
                </span>
                <span className="text-[10px] tracking-wider font-semibold text-amber-500/90 font-mono -mt-1">
                  AGEN KARHUTLA
                </span>
              </div>
            </Link>
          </div>

          {/* System Status Pill */}
          <div className="mx-2 rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Sistem Aktif
              </span>
              <span className="text-[10px] text-slate-500 font-mono">v1.0-alpha</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              NASA FIRMS & Landsat GEE Connected
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Modul Utama
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-amber-400" : "text-slate-400"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        isActive
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User & Target Agencies */}
        <div className="border-t border-slate-800/80 pt-4 px-2 space-y-3">
          <div className="rounded-lg bg-slate-900/40 p-2 text-xs border border-slate-800/60">
            <div className="text-[10px] uppercase font-semibold text-slate-500">
              Target Operasional
            </div>
            <div className="text-slate-300 mt-0.5 font-medium text-[11px]">
              BPBD • Manggala Agni • KPH
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>© 2026 SIGAP</span>
            <span className="flex items-center gap-1 text-slate-400 hover:text-slate-300 cursor-pointer">
              Docs <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
