"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motionPageEnter } from "@/lib/ui/motion";
import { cn } from "@/lib/utils/cn";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/** Subtle dashboard page entrance — opacity + 6px translate, 150ms. */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn(motionPageEnter, className)}>
      {children}
    </div>
  );
}
