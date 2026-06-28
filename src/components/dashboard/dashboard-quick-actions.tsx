import Link from "next/link";
import {
  CreditCard,
  FileText,
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
  icon: LucideIcon;
}> = [
  { href: "/clients/new", label: "Create Client", icon: UserPlus },
  { href: "/reports/new", label: "Create Report", icon: FileText },
  { href: "/settings/team", label: "Invite Team Member", icon: Users },
  { href: "/settings/plans", label: "View Pricing", icon: CreditCard },
];

export function DashboardQuickActions() {
  return (
    <DashboardPanel title="Quick actions" description="Move faster across your workspace.">
      <div className="grid gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-muted/5 px-4 py-3.5 text-sm font-medium text-foreground",
              transitionInteractive,
              "hover:-translate-y-px hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm",
              focusRing,
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-primary">
              <Icon icon={action.icon} size="sm" />
            </span>
            {action.label}
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
