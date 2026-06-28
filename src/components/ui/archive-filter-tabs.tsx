import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { filterTabActive, filterTabInactive } from "@/lib/ui/tokens";

type ArchiveFilterTab = {
  label: string;
  href: string;
  active: boolean;
};

type ArchiveFilterTabsProps = {
  tabs: ArchiveFilterTab[];
  className?: string;
};

export function ArchiveFilterTabs({ tabs, className }: ArchiveFilterTabsProps) {
  return (
    <nav
      aria-label="Filter records"
      className={cn("mb-4 flex flex-wrap items-center gap-2", className)}
    >
      {tabs.map((tab, index) => (
        <span key={tab.href} className="flex items-center gap-2">
          {index > 0 ? <span className="text-border" aria-hidden>|</span> : null}
          <Link
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={tab.active ? filterTabActive : filterTabInactive}
          >
            {tab.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
