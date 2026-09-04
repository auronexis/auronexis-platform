"use client";

import {
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

export type OperationsCenterTab = {
  id: string;
  label: string;
  /** Optional count shown on the tab (urgent / items). */
  badge?: number | null;
  /** When true, badge uses danger tone. */
  urgent?: boolean;
  content: ReactNode;
};

type OperationsCenterProps = {
  tabs: OperationsCenterTab[];
  defaultTabId?: string;
  /** Compact summary strip rendered above tabs (always visible). */
  summary?: ReactNode;
  className?: string;
};

/**
 * Progressive-disclosure Operations Center — one tab panel visible at a time.
 * All tab content is still mounted in the DOM for SEO-less app routes and
 * to keep feature reachability without remounting heavy server-fed trees.
 * Inactive panels use `hidden` (not unmounted) so state/links stay intact.
 */
export function OperationsCenter({
  tabs,
  defaultTabId,
  summary,
  className,
}: OperationsCenterProps) {
  const baseId = useId();
  const initial =
    tabs.find((tab) => tab.id === defaultTabId)?.id ?? tabs[0]?.id ?? "overview";
  const [activeId, setActiveId] = useState(initial);

  if (tabs.length === 0) {
    return null;
  }

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );

  function selectTab(id: string) {
    setActiveId(id);
  }

  function onTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (tabs.length < 2) return;
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    let next = activeIndex;
    if (key === "ArrowRight") next = (activeIndex + 1) % tabs.length;
    if (key === "ArrowLeft") next = (activeIndex - 1 + tabs.length) % tabs.length;
    if (key === "Home") next = 0;
    if (key === "End") next = tabs.length - 1;
    const nextId = tabs[next]?.id;
    if (nextId) {
      setActiveId(nextId);
      const button = document.getElementById(`${baseId}-tab-${nextId}`);
      button?.focus();
    }
  }

  return (
    <div className={cn("space-y-4", className)} data-operations-center>
      {summary ? (
        <div
          className="rounded-xl border border-border/70 bg-surface/60 px-4 py-3"
          data-operations-summary
        >
          {summary}
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Operations categories"
        className="flex flex-wrap gap-2"
        onKeyDown={onTabListKeyDown}
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          const badge = tab.badge != null && tab.badge > 0 ? tab.badge : null;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                transitionInteractive,
                focusRing,
                selected
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border/70 bg-surface/40 text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {tab.label}
              {badge != null ? (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    tab.urgent
                      ? "bg-danger/15 text-danger"
                      : "bg-muted/20 text-muted",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={!selected}
            data-operations-tab={tab.id}
            data-operations-tab-active={selected ? "true" : "false"}
            className={selected ? "space-y-4" : undefined}
          >
            {tab.content}
          </div>
        );
      })}
    </div>
  );
}
