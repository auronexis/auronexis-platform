import type { AdoptionFeatureSignal } from "@/lib/adoption/types";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import { Check, Lock, Circle } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type AdoptionFeatureListProps = {
  signals: AdoptionFeatureSignal[];
};

export function AdoptionFeatureList({ signals }: AdoptionFeatureListProps) {
  const adopted = signals.filter((s) => s.available && s.adopted);
  const unused = signals.filter((s) => s.available && !s.adopted);
  const locked = signals.filter((s) => !s.available);

  return (
    <div className="space-y-6">
      <FeatureGroup
        title="Adopted features"
        description={`${adopted.length} of ${signals.filter((s) => s.available).length} available features in use.`}
        signals={adopted}
        variant="adopted"
      />
      <FeatureGroup
        title="Available but unused"
        description="Features you can adopt to broaden workspace value."
        signals={unused}
        variant="unused"
      />
      {locked.length > 0 ? (
        <FeatureGroup
          title="Plan-locked features"
          description="Not counted against your adoption score."
          signals={locked}
          variant="locked"
        />
      ) : null}
    </div>
  );
}

function FeatureGroup({
  title,
  description,
  signals,
  variant,
}: {
  title: string;
  description: string;
  signals: AdoptionFeatureSignal[];
  variant: "adopted" | "unused" | "locked";
}) {
  if (signals.length === 0) {
    return null;
  }

  const StatusIcon = variant === "adopted" ? Check : variant === "locked" ? Lock : Circle;

  return (
    <section aria-label={title}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <ul className="mt-3 space-y-2">
        {signals.map((signal) => (
          <li
            key={signal.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5",
              variant === "locked" && "opacity-70",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={StatusIcon}
                size="sm"
                className={cn(
                  variant === "adopted" && "text-success",
                  variant === "unused" && "text-muted",
                  variant === "locked" && "text-muted",
                )}
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-foreground">{signal.label}</p>
                <p className="text-xs text-muted capitalize">{signal.importance} · {signal.category}</p>
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              {signal.adopted && signal.usageCount30d > 0 ? (
                <span>{signal.usageCount30d} use{signal.usageCount30d === 1 ? "" : "s"} (30d)</span>
              ) : signal.route && variant === "unused" ? (
                <Link href={signal.route} className={cn(linkText, "text-xs")}>
                  Open
                </Link>
              ) : variant === "locked" ? (
                <span>Locked</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
