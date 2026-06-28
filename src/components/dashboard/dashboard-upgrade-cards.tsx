import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { linkText, transitionInteractive } from "@/lib/ui/tokens";

type DashboardUpgradeMetricCardProps = {
  label: string;
  requiredPlanLabel?: string;
  message: string;
  href?: string;
  className?: string;
};

export function DashboardUpgradeMetricCard({
  label,
  requiredPlanLabel = "Professional",
  message,
  href = "/settings/plans",
  className,
}: DashboardUpgradeMetricCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-surface to-surface p-5 shadow-sm",
        transitionInteractive,
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-interactive",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-base font-semibold text-foreground">
        Upgrade to {requiredPlanLabel}
      </p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <Link
        href={href}
        className={cn(linkText, "mt-4 inline-flex items-center gap-1.5 text-sm no-underline hover:underline")}
      >
        View plans
        <Icon icon={ArrowRight} size="sm" />
      </Link>
    </article>
  );
}

type DashboardUpgradeFeatureCardProps = {
  title: string;
  message: string;
  requiredPlanLabel?: string;
  href?: string;
  className?: string;
};

export function DashboardUpgradeFeatureCard({
  title,
  message,
  requiredPlanLabel = "Business",
  href = "/settings/plans",
  className,
}: DashboardUpgradeFeatureCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-surface to-surface p-6 shadow-sm",
        transitionInteractive,
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-interactive",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        Upgrade to {requiredPlanLabel}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      <Link
        href={href}
        className={cn(linkText, "mt-5 inline-flex items-center gap-1.5 text-sm no-underline hover:underline")}
      >
        Learn more
        <Icon icon={ArrowRight} size="sm" />
      </Link>
    </article>
  );
}
