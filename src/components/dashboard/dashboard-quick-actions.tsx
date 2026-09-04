import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  FileText,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

const ACTIONS: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: "/clients/new",
    label: "New client",
    description: "Add a client to your portfolio",
    icon: UserPlus,
  },
  {
    href: "/reports/new",
    label: "Generate report",
    description: "Draft and publish client reports",
    icon: FileText,
  },
  {
    href: "/risks?tab=open",
    label: "Open risks",
    description: "Review and mitigate client risks",
    icon: ShieldAlert,
  },
  {
    href: "/settings/team",
    label: "Invite user",
    description: "Add teammates to your workspace",
    icon: Users,
  },
  {
    href: "/knowledge",
    label: "Knowledge hub",
    description: "Articles, playbooks, and learnings",
    icon: BookOpen,
  },
  {
    href: "/settings/billing",
    label: "Billing",
    description: "Plans, invoices, and subscription",
    icon: CreditCard,
  },
];

type DashboardQuickActionsProps = {
  /** Dense icon+label grid for activated workspaces. */
  compact?: boolean;
};

export function DashboardQuickActions({ compact = false }: DashboardQuickActionsProps) {
  return (
    <DashboardPanel
      title="Quick actions"
      description={compact ? undefined : "Move faster across your workspace."}
      contentClassName={compact ? "p-3" : undefined}
    >
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" : "sm:grid-cols-2 xl:grid-cols-3 gap-3",
        )}
      >
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            title={action.description}
            className={cn(
              "flex rounded-xl border border-border bg-muted/5",
              compact
                ? "min-h-11 items-center gap-2 px-3 py-2"
                : "items-start gap-3 px-4 py-3.5",
              transitionInteractive,
              "hover:-translate-y-px hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm",
              focusRing,
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary",
                compact ? "h-8 w-8" : "h-10 w-10",
              )}
            >
              <Icon icon={action.icon} size="sm" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{action.label}</span>
              {!compact ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {action.description}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
