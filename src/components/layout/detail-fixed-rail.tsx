"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  dashboardDetailRailAnchor,
  dashboardFixedDetailRail,
  dashboardFixedDetailRailInner,
} from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

const XL_BREAKPOINT = 1280;
/** Matches top-24 — below lg topbar (h-16) with safe spacing. */
const FIXED_RAIL_TOP = "6rem";

type DetailFixedRailProps = {
  children: ReactNode;
  className?: string;
};

/** Desktop fixed overview rail — reserves grid space and pins below the topbar. */
export function DetailFixedRail({ children, className }: DetailFixedRailProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pinStyle, setPinStyle] = useState<CSSProperties | undefined>(undefined);
  const [isDesktopFixed, setIsDesktopFixed] = useState(false);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const main = document.getElementById("main-content");

    const update = () => {
      const desktop = window.innerWidth >= XL_BREAKPOINT;
      setIsDesktopFixed(desktop);

      if (!desktop || !anchor) {
        setPinStyle(undefined);
        return;
      }

      const { left, width } = anchor.getBoundingClientRect();
      setPinStyle({
        position: "fixed",
        top: FIXED_RAIL_TOP,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 20,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    if (anchor) observer.observe(anchor);
    if (main) observer.observe(main);

    main?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      main?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className={cn("min-w-0", className)}>
      <div ref={anchorRef} className={dashboardDetailRailAnchor} aria-hidden />
      <aside
        className={cn(
          isDesktopFixed ? dashboardFixedDetailRail : "xl:hidden",
          !isDesktopFixed && "mb-0",
        )}
        style={pinStyle}
        aria-label="Page overview"
      >
        <div className={dashboardFixedDetailRailInner}>{children}</div>
      </aside>
    </div>
  );
}
