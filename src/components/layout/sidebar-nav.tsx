"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarSection } from "@/components/layout/sidebar-section";
import { Icon } from "@/components/ui/icon";
import { SIDEBAR_SECTIONS } from "@/lib/layout/sidebar-sections";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import type { NavItemView } from "@/lib/tenancy/context";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Brain,
  ClipboardCheck,
  HeartPulse,
  LayoutDashboard,
  Lock,
  Settings,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  Workflow,
  Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Adoption: HeartPulse,
  "Customer Success": ClipboardCheck,
  Intelligence: Brain,
  Clients: Users,
  Risks: AlertTriangle,
  Incidents: FileText,
  Reports: BarChart3,
  Automation: Workflow,
  Knowledge: BookOpen,
  Profitability: TrendingUp,
  Activity: Activity,
  Team: UserCog,
  Pricing: CreditCard,
  Sales: Handshake,
  Settings: Settings,
};

type SidebarNavProps = {
  items: NavItemView[];
  collapsed?: boolean;
  onNavigate?: () => void;
};

function getLockedTooltip(item: NavItemView): string {
  if (item.requiredPlanLabel) {
    return `Available on ${item.requiredPlanLabel}`;
  }
  return "Upgrade required";
}

type SidebarNavItemProps = {
  item: NavItemView;
  isActive: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function SidebarNavItem({ item, isActive, collapsed = false, onNavigate }: SidebarNavItemProps) {
  const IconComponent = NAV_ICONS[item.label] ?? LayoutDashboard;
  const isPricing = item.label === "Pricing";

  const content = (
    <>
      <Icon
        icon={IconComponent}
        size="md"
        className={cn(
          "shrink-0 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          isActive ? "text-white" : item.locked ? "text-muted" : "text-muted group-hover:text-primary-foreground group-hover:brightness-110",
          isActive && !item.locked && "text-blue-100",
        )}
      />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
        {!collapsed ? (
          <>
            <span className="truncate transition-colors duration-150 group-hover:text-white">{item.label}</span>
            {isPricing && !item.locked ? (
              <Icon icon={Sparkles} size="sm" className="shrink-0 text-amber-300/80" />
            ) : null}
          </>
        ) : null}
      </span>
      {!collapsed && item.locked ? (
        <Icon icon={Lock} size="sm" className="ml-auto shrink-0 text-muted" />
      ) : null}
    </>
  );

  const baseClassName = cn(
    "group relative flex h-9 items-center rounded-lg text-sm font-medium",
    collapsed ? "justify-center px-2" : "gap-2.5 px-2.5",
    transitionInteractive,
    focusRing,
    item.locked
      ? "text-muted/90 hover:bg-white/5 hover:text-primary-foreground"
      : isActive
        ? "bg-primary/15 text-white shadow-sm transition-colors duration-150"
        : "text-muted hover:bg-white/[0.06] hover:text-white",
  );

  const activeAccent = isActive && !item.locked ? (
    <span
      className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-primary transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      aria-hidden
    />
  ) : null;

  const linkAriaLabel = collapsed ? item.label : undefined;

  if (item.locked) {
    return (
      <li>
        <Link
          href={item.href}
          className={baseClassName}
          aria-label={
            collapsed
              ? `${item.label} — ${getLockedTooltip(item)}`
              : `${item.label} — ${getLockedTooltip(item)}`
          }
          onClick={onNavigate}
        >
          {activeAccent}
          {content}
          <span
            role="tooltip"
            title={getLockedTooltip(item)}
            className={cn(
              "pointer-events-none absolute bottom-full left-2 z-50 mb-2 whitespace-nowrap rounded-md border border-white/10 bg-navy-900 px-2 py-1 text-xs text-primary-foreground opacity-0 shadow-lg",
              transitionInteractive,
              "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            {getLockedTooltip(item)}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={baseClassName}
        aria-label={linkAriaLabel}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        {activeAccent}
        {content}
      </Link>
    </li>
  );
}

/** Grouped sidebar navigation with premium active and locked states. */
export function SidebarNav({ items, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const itemsByLabel = new Map(items.map((item) => [item.label, item]));

  return (
    <nav className="space-y-5 py-4" aria-label="Primary">
      {SIDEBAR_SECTIONS.map((section, index) => {
        const sectionItems = section.itemLabels
          .map((label) => itemsByLabel.get(label))
          .filter((item): item is NavItemView => item !== undefined);

        if (sectionItems.length === 0) {
          return null;
        }

        return (
          <SidebarSection
            key={section.id}
            label={section.label}
            className={index === 0 ? "pt-0" : "pt-1"}
            collapsed={collapsed}
          >
            {sectionItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              );
            })}
          </SidebarSection>
        );
      })}
    </nav>
  );
}
