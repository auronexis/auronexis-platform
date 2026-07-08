"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SecondaryNavBar,
  type SecondaryNavItem,
} from "@/components/layout/secondary-nav-bar";

const CLIENT_SECTIONS: SecondaryNavItem[] = [
  { id: "client-summary", label: "Overview" },
  { id: "client-health", label: "Health" },
  { id: "client-reports", label: "Reports" },
  { id: "client-risks", label: "Risks" },
  { id: "client-incidents", label: "Incidents" },
  { id: "client-knowledge", label: "Knowledge" },
  { id: "client-kpis", label: "Profitability" },
  { id: "client-settings", label: "Settings" },
];

const OBSERVER_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 1] as const;
const OBSERVER_ROOT_MARGIN = "-52px 0px -45% 0px";

type ClientSecondaryNavProps = {
  className?: string;
};

function getMainScrollContainer(): HTMLElement | null {
  return document.getElementById("main-content");
}

/** Client detail secondary navigation — sticky after KPI cards, GitHub-style tabs. */
export function ClientSecondaryNav({ className }: ClientSecondaryNavProps) {
  const [activeId, setActiveId] = useState<string>(CLIENT_SECTIONS[0].id);
  const visibilityRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const main = getMainScrollContainer();
    const sections = CLIENT_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (!main || sections.length === 0) {
      return;
    }

    const pickActiveSection = () => {
      let nextActive = CLIENT_SECTIONS[0].id;
      let bestScore = -1;

      for (const section of CLIENT_SECTIONS) {
        const ratio = visibilityRef.current.get(section.id) ?? 0;
        if (ratio > bestScore) {
          bestScore = ratio;
          nextActive = section.id;
        }
      }

      if (bestScore > 0) {
        setActiveId(nextActive);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibilityRef.current.set(entry.target.id, entry.intersectionRatio);
        }
        pickActiveSection();
      },
      {
        root: main,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: [...OBSERVER_THRESHOLDS],
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    pickActiveSection();

    const visibility = visibilityRef.current;

    return () => {
      observer.disconnect();
      visibility.clear();
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    setActiveId(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <SecondaryNavBar
      items={CLIENT_SECTIONS}
      activeId={activeId}
      onSelect={scrollToSection}
      ariaLabel="Client sections"
      className={className}
    />
  );
}
