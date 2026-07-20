import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { FOOTER_LINKS } from "@/lib/company/contact";
import { getInitials } from "@/components/client-portal/portal-theme";
import {
  auroraSurface,
  auroraTableCell,
  auroraTableHeaderCell,
  auroraTableShell,
} from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";

const HERO_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

export function PortalUserAvatar({
  name,
  className,
  primaryColor,
}: {
  name: string;
  className?: string;
  primaryColor?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground ring-2 ring-primary-foreground/20",
        !primaryColor && "bg-primary",
        className,
      )}
      style={primaryColor ? { backgroundColor: primaryColor } : undefined}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

export function PortalFooter({ branding }: { branding: ResolvedOrganizationBranding }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-primary-foreground/10 text-primary-foreground"
      style={{
        background: `linear-gradient(180deg, ${branding.secondaryColor} 0%, ${branding.secondaryColor}EE 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo branding={branding} size="sm" variant="light" />
          <div>
            <p className="text-sm font-semibold">{branding.companyName}</p>
            <p className="text-xs text-muted">© {year} {branding.companyName}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {FOOTER_LINKS.slice(0, 4).map((link) => (
              <a key={link.href} href={link.href} className="text-muted hover:underline">
                {link.label}
              </a>
            ))}
          </div>
          {branding.hidePlatformBranding ? (
            <p className="text-xs text-muted">
              {branding.supportEmail ? (
                <>
                  Support:{" "}
                  <a href={`mailto:${branding.supportEmail}`} className="hover:underline">
                    {branding.supportEmail}
                  </a>
                </>
              ) : branding.supportUrl ? (
                <a href={branding.supportUrl} className="hover:underline">
                  {branding.supportUrl}
                </a>
              ) : (
                branding.companyName
              )}
            </p>
          ) : (
            <p className="text-xs text-muted">
              Powered by{" "}
              <span className="font-medium" style={{ color: branding.primaryColor }}>
                {PLATFORM_NAME}
              </span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: branding.primaryColor }} aria-hidden />
            Secure. Trusted. Reliable.
          </p>
        </div>
      </div>
    </footer>
  );
}

type PortalCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function PortalCard({ children, className, hover = false }: PortalCardProps) {
  return (
    <div
      className={cn(
        auroraSurface,
        "p-6",
        hover &&
          "transition duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-interactive",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PortalKpiCardProps = {
  label: string;
  icon: LucideIcon;
  tone: "success" | "warning" | "danger" | "primary" | "neutral";
  href?: string;
  children: ReactNode;
  subtext?: string;
};

const kpiToneStyles = {
  success: {
    icon: "bg-success/10 text-success",
    metric: "text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    metric: "text-foreground",
  },
  danger: {
    icon: "bg-danger/10 text-danger",
    metric: "text-foreground",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    metric: "text-foreground",
  },
  neutral: {
    icon: "bg-muted/10 text-muted",
    metric: "text-foreground",
  },
} as const;

export function PortalKpiCard({
  label,
  icon: Icon,
  tone,
  href,
  children,
  subtext,
}: PortalKpiCardProps) {
  const styles = kpiToneStyles[tone];

  const content = (
    <PortalCard hover={Boolean(href)} className="relative h-full">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {href ? <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden /> : null}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <div className={cn("mt-2", styles.metric)}>{children}</div>
      {subtext ? <p className="mt-2 text-sm text-muted">{subtext}</p> : null}
    </PortalCard>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

type PortalPageHeaderProps = {
  title: string;
  description?: string;
};

export function PortalPageHeader({ title, description }: PortalPageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}

type PortalHeroProps = {
  clientName: string;
  branding: ResolvedOrganizationBranding;
};

export function PortalHero({ clientName, branding }: PortalHeroProps) {
  return (
    <section
      className="relative mb-8 overflow-hidden rounded-2xl shadow-lg"
      style={{
        minHeight: "240px",
        background: `linear-gradient(115deg, ${branding.secondaryColor} 0%, ${branding.secondaryColor}CC 52%, ${branding.primaryColor}55 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: HERO_PATTERN }} aria-hidden />
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/10 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-y-0 right-0 w-[45%]"
        style={{
          background: `radial-gradient(ellipse at center, ${branding.primaryColor}26 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative flex h-full min-h-[240px] flex-col justify-center px-8 py-10 sm:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
          {branding.companyName} Client Portal
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          Welcome, {clientName}
        </h1>
        <p className="mt-3 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
          {branding.portalWelcomeMessage}
        </p>
      </div>
    </section>
  );
}

type PortalQuickAccessCardProps = {
  href: string;
  icon: LucideIcon;
  tone: "primary" | "warning" | "danger";
  title: string;
  description: string;
};

const quickAccessTone = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
} as const;

export function PortalQuickAccessCard({
  href,
  icon: Icon,
  tone,
  title,
  description,
}: PortalQuickAccessCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <PortalCard hover className="flex h-full items-center gap-5">
        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", quickAccessTone[tone])}>
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </PortalCard>
    </Link>
  );
}

type PortalEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PortalEmptyState({ title, description, action }: PortalEmptyStateProps) {
  return (
    <PortalCard className="flex min-h-[12rem] flex-col items-center justify-center border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      <p className="text-lg font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </PortalCard>
  );
}

type PortalTableShellProps = {
  children: ReactNode;
};

export function PortalTableShell({ children }: PortalTableShellProps) {
  return (
    <div className={auroraTableShell}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function PortalKpiMetric({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-3xl font-bold tracking-tight text-foreground", className)}>{children}</p>;
}

export function PortalSentBadge() {
  return (
    <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success ring-1 ring-success/20">
      Sent
    </span>
  );
}

export const portalTableHeadClass = auroraTableHeaderCell.replace("px-5", "px-6");

export const portalTableCellClass = auroraTableCell.replace("px-5", "px-6");

export function PortalActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border border-border-subtle bg-surface-1 text-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}
