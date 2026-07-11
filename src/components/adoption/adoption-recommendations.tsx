"use client";

import Link from "next/link";
import type { AdoptionRecommendation, AdoptionSnapshot } from "@/lib/adoption/types";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { buildAdoptionAnalyticsProps } from "@/lib/adoption/events";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { Lock } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type AdoptionRecommendationsProps = {
  recommendations: AdoptionRecommendation[];
  snapshot: AdoptionSnapshot;
  compact?: boolean;
};

function RecommendationCard({
  item,
  snapshot,
}: {
  item: AdoptionRecommendation;
  snapshot: AdoptionSnapshot;
}) {
  const canAct = item.available && item.permitted;

  const content = (
    <>
      <p className="text-sm font-semibold text-foreground">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
      <p className="mt-2 text-xs text-muted">
        <span className="font-medium text-foreground">Why: </span>
        {item.reason}
      </p>
      {canAct ? (
        <span className="mt-3 inline-flex text-xs font-semibold text-primary">
          {item.ctaLabel} →
        </span>
      ) : (
        <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted">
          <Icon icon={Lock} size="sm" aria-hidden />
          {!item.available ? "Upgrade required" : "Insufficient permissions"}
        </span>
      )}
    </>
  );

  if (!canAct) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-4 opacity-80">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.route}
      className={cn(
        "block rounded-xl border border-border bg-gradient-to-br from-surface to-surface-2 px-4 py-4",
        transitionInteractive,
        "hover:-translate-y-px hover:border-primary/25 hover:shadow-sm motion-reduce:transform-none",
        focusRing,
      )}
      onClick={() => {
        trackAnalyticsEvent(
          "adoption_recommendation_clicked",
          buildAdoptionAnalyticsProps(snapshot, { recommendation_key: item.key }),
        );
      }}
    >
      {content}
    </Link>
  );
}

export function AdoptionRecommendations({
  recommendations,
  snapshot,
  compact = false,
}: AdoptionRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted">
        No adoption recommendations right now. Your workspace usage looks balanced.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-3", compact && "space-y-2")}>
      {recommendations.map((item) => (
        <li key={item.key}>
          <RecommendationCard item={item} snapshot={snapshot} />
        </li>
      ))}
    </ul>
  );
}
