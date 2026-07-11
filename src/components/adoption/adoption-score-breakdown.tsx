import type { AdoptionScoreBreakdown } from "@/lib/adoption/types";
import { ADOPTION_SCORE_WEIGHTS } from "@/lib/adoption/constants";

type AdoptionScoreBreakdownPanelProps = {
  breakdown: AdoptionScoreBreakdown;
};

const CATEGORIES: {
  key: keyof Omit<AdoptionScoreBreakdown, "total">;
  label: string;
  weight: number;
  description: string;
}[] = [
  {
    key: "foundation",
    label: "Foundation",
    weight: ADOPTION_SCORE_WEIGHTS.foundation,
    description: "Clients, activation progress, and core setup.",
  },
  {
    key: "recurringValue",
    label: "Recurring value",
    weight: ADOPTION_SCORE_WEIGHTS.recurringValue,
    description: "Meaningful events and published reports in the last 30 days.",
  },
  {
    key: "featureBreadth",
    label: "Feature breadth",
    weight: ADOPTION_SCORE_WEIGHTS.featureBreadth,
    description: "Share of available features actively used.",
  },
  {
    key: "engagementRecency",
    label: "Engagement recency",
    weight: ADOPTION_SCORE_WEIGHTS.engagementRecency,
    description: "How recently meaningful product activity occurred.",
  },
  {
    key: "collaboration",
    label: "Collaboration",
    weight: ADOPTION_SCORE_WEIGHTS.collaboration,
    description: "Active users and team expansion.",
  },
  {
    key: "customerVisibility",
    label: "Customer visibility",
    weight: ADOPTION_SCORE_WEIGHTS.customerVisibility,
    description: "Published delivery and customer-facing activity.",
  },
];

export function AdoptionScoreBreakdownPanel({ breakdown }: AdoptionScoreBreakdownPanelProps) {
  return (
    <div className="space-y-4" aria-label="Adoption score breakdown">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted">Overall adoption score</p>
        <p
          className="text-3xl font-semibold text-foreground"
          aria-label={`Adoption score ${breakdown.total} out of 100`}
        >
          {breakdown.total}
          <span className="text-base font-normal text-muted"> / 100</span>
        </p>
      </div>

      <ul className="space-y-3">
        {CATEGORIES.map((category) => {
          const score = breakdown[category.key];
          const percent = category.weight > 0 ? Math.round((score / category.weight) * 100) : 0;
          return (
            <li key={category.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{category.label}</span>
                <span className="text-muted" aria-label={`${category.label}: ${score} of ${category.weight} points`}>
                  {score}/{category.weight}
                </span>
              </div>
              <p className="text-xs text-muted">{category.description}</p>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted/15"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={category.weight}
                aria-label={`${category.label} score`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
