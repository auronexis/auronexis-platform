"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { clientDetailSectionNavSticky, focusRing, transitionInteractive } from "@/lib/ui/tokens";

const SECTIONS = [
  { id: "client-summary", label: "Overview" },
  { id: "client-health", label: "Health" },
  { id: "client-reports", label: "Reports" },
  { id: "client-risks", label: "Risks" },
  { id: "client-incidents", label: "Incidents" },
  { id: "client-knowledge", label: "Knowledge" },
  { id: "client-kpis", label: "Profitability" },
  { id: "client-settings", label: "Settings" },
] as const;

const STICKY_NAV_OFFSET_PX = 56;

type ClientDetailSectionNavProps = {
  className?: string;
};

/** In-page anchor navigation for client detail sections. */
export function ClientDetailSectionNav({ className }: ClientDetailSectionNavProps) {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const main = document.getElementById("main-content");
    const sections = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sections.length === 0) {
      return;
    }

    const updateActive = () => {
      const rootTop = main ? main.getBoundingClientRect().top : 0;
      const threshold = rootTop + STICKY_NAV_OFFSET_PX;
      let current = sections[0]?.id ?? SECTIONS[0].id;

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) {
          current = section.id;
        }
      }

      setActiveId(current);
    };

    updateActive();
    main?.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      main?.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  const scrollTo = useCallback((id: string) => {
    const target = document.getElementById(id);
    const main = document.getElementById("main-content");
    if (!target || !main) {
      return;
    }

    const mainRect = main.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = main.scrollTop + (targetRect.top - mainRect.top) - STICKY_NAV_OFFSET_PX;

    main.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    setActiveId(id);
  }, []);

  return (
    <nav aria-label="Client sections" className={cn(clientDetailSectionNavSticky, className)}>
      <div className="overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-1 py-2">
          {SECTIONS.map((section) => {
            const isActive = activeId === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium sm:text-sm",
                    transitionInteractive,
                    focusRing,
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-muted/10 hover:text-foreground",
                  )}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
