import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 active:bg-amber-600 shadow-sm shadow-amber-500/20",
      secondary:
        "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-750 border border-slate-700",
      ghost:
        "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700",
      outline:
        "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-10 px-4 text-sm rounded-lg gap-2",
      lg: "h-12 px-6 text-base rounded-lg gap-2.5",
      icon: "h-10 w-10 p-2 rounded-lg",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
