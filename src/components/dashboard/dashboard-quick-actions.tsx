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

export function DashboardQuickActions() {
  return (
    <DashboardPanel title="Quick actions" description="Move faster across your workspace.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border bg-muted/5 px-4 py-3.5",
              transitionInteractive,
              "hover:-translate-y-px hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm",
              focusRing,
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
              <Icon icon={action.icon} size="sm" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{action.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
