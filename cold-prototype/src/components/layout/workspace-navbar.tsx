"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SigapLogo } from "@/components/layout/sigap-logo";
import { NAV_ITEMS, NavMenu, isActivePath } from "@/components/layout/nav-menu";

/**
 * Navbar for the secondary modules. Reuses the Figma navbar/desktop shell
 * (grey bar, SIGAP mark) with module tabs styled like the "Drone X" pills.
 */
export function WorkspaceNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[1001] bg-sigap-panel drop-shadow-[0_4px_2px_rgba(0,0,0,0.25)]">
      <div className="flex h-[96px] items-center gap-6 px-[25px] lg:h-[130px] lg:gap-10 xl:px-[72px]">
        <span className="lg:hidden">
          <SigapLogo size="mobile" />
        </span>
        <span className="hidden lg:block">
          <SigapLogo />
        </span>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto xl:flex 2xl:gap-3">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center rounded-[10px] px-3 font-mono text-[15px] font-medium leading-none tracking-[-0.3px] transition-colors xl:text-[16px] 2xl:px-[15px] 2xl:text-[20px]",
                  active
                    ? "bg-sigap-cobalt text-white"
                    : "text-slate-800 hover:bg-sigap-cobalt/15"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto xl:hidden">
          <NavMenu size="mobile" />
        </div>
      </div>
    </header>
  );
}
