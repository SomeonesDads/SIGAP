import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  className?: string;
  variant?: "default" | "warning" | "danger" | "info";
}

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  const variantBadgeStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:border-slate-700",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-100">
              {value}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-400 font-normal">
                {subtitle}
              </span>
            )}
          </div>

          {trend && (
            <div className="mt-2.5 flex items-center text-xs">
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {trend.value}
              </span>
              {trend.label && (
                <span className="ml-1.5 text-slate-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl border p-3 flex items-center justify-center",
            variantBadgeStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
