"use client";

import { cn } from "@/lib/utils/cn";
import { focusRing, secondaryNavBarSticky, secondaryNavTab, transitionInteractive } from "@/lib/ui/tokens";

export type SecondaryNavItem = {
  id: string;
  label: string;
};

type SecondaryNavBarProps = {
  items: SecondaryNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
};

/** Enterprise-style in-page secondary navigation — sticky sub-nav for detail workspaces. */
export function SecondaryNavBar({
  items,
  activeId,
  onSelect,
  ariaLabel = "Page sections",
  className,
}: SecondaryNavBarProps) {
  return (
    <nav aria-label={ariaLabel} className={cn(secondaryNavBarSticky, className)}>
      <div className="overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-0.5 px-1" role="list">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    secondaryNavTab,
                    transitionInteractive,
                    focusRing,
                    isActive ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
