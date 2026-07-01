import Link from "next/link";
import type { SlaPolicy } from "@/types/database";
import { formatSlaHours } from "@/lib/sla/calculations";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type SLAPolicyCardProps = {
  policy: SlaPolicy;
  href?: string;
  className?: string;
};

export function SLAPolicyCard({ policy, href, className }: SLAPolicyCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm transition hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{policy.name}</h3>
          {policy.is_default ? (
            <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
              Default
            </span>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Incident response</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatSlaHours(policy.incident_hours)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Risk response</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatSlaHours(policy.risk_hours)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Critical response</dt>
          <dd className="mt-0.5 font-medium text-foreground">{policy.critical_response_minutes} min</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Critical resolution</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {Math.round(policy.critical_resolution_minutes / 60)} h
          </dd>
        </div>
      </dl>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn(linkText, "block no-underline hover:no-underline")}>
        {content}
      </Link>
    );
  }

  return content;
}
