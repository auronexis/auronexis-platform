"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

/** Lightweight CSS tooltip — fade 120ms, 8px radius, soft shadow. */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-md",
          "transition-opacity duration-[120ms] ease-out",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "top-full left-1/2 mt-2 -translate-x-1/2",
        )}
      >
        {content}
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-border bg-surface",
            side === "top" ? "-bottom-1 border-t-0 border-l-0" : "-top-1 border-b-0 border-r-0",
          )}
        />
      </span>
    </span>
  );
}
