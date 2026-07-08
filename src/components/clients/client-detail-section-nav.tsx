"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

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
      const threshold = rootTop + 120;
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
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }, []);

  return (
    <nav
      aria-label="Client sections"
      className={cn(
        "sticky top-0 z-10 -mx-1 mb-6 overflow-x-auto border-b border-border/70 bg-background/95 pb-px backdrop-blur-sm",
        className,
      )}
    >
      <ul className="flex min-w-max gap-1 px-1 py-2">
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
    </nav>
  );
}
