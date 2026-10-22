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
      "inline-flex items-center justify-center font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigap-cobalt focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    // Variants follow the Figma "Drone X" pills: solid cobalt = active, 40% cobalt = secondary
    const variantStyles = {
      primary:
        "bg-sigap-cobalt text-white font-semibold hover:bg-[#0f63bd] active:bg-[#0d569f]",
      secondary:
        "bg-sigap-panel text-slate-900 hover:bg-[#cfcfcf] active:bg-[#c4c4c4]",
      ghost:
        "text-slate-700 hover:bg-black/5 hover:text-slate-900",
      danger:
        "bg-sigap-crimson text-white hover:bg-[#bb120f] active:bg-[#a10f0d]",
      outline:
        "border-2 border-sigap-cobalt bg-transparent text-sigap-cobalt hover:bg-sigap-cobalt/10",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-[8px] gap-1.5",
      md: "h-10 px-4 text-sm rounded-[10px] gap-2",
      lg: "h-12 px-6 text-base rounded-[10px] gap-2.5",
      icon: "h-10 w-10 p-2 rounded-[10px]",
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
