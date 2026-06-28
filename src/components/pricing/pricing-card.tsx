import { Button } from "@/components/ui/button";
import {
  formatPlanPrice,
  getPlanActionButtonLabel,
  type PlanActionLabel,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import { getPricingHighlights } from "@/lib/plans/features";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type PricingCardProps = {
  plan: SubscriptionPlanDefinition;
  action: PlanActionLabel;
  isCurrent: boolean;
  isLoading: boolean;
  canManage: boolean;
  seatBlockMessage?: string | null;
  disabledReasons?: string[];
  isDisabled?: boolean;
  onSelect: () => void;
};

export function PricingCard({
  plan,
  action,
  isCurrent,
  isLoading,
  canManage,
  seatBlockMessage,
  disabledReasons = [],
  isDisabled = false,
  onSelect,
}: PricingCardProps) {
  const isRecommended = Boolean(plan.recommended);
  const pricingHighlights = getPricingHighlights(plan.key);
  const buttonDisabled = isDisabled || isLoading;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm",
        focusRing,
        isRecommended
          ? "border-primary/30 shadow-md ring-1 ring-primary/15"
          : "",
        isCurrent && "border-success/40 ring-1 ring-success/15",
      )}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {isRecommended ? (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recommended
          </span>
        ) : null}
        {isCurrent ? (
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success/20">
            Current Plan
          </span>
        ) : null}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{plan.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{plan.description}</p>
      </div>

      <div className="mb-8">
        <p className="text-4xl font-semibold tracking-tight text-foreground">
          {formatPlanPrice(plan)}
        </p>
        <p className="mt-1 text-sm text-muted">per month</p>
        <div className="mt-2 space-y-1">
          {pricingHighlights.map((highlight) => (
            <p key={highlight} className="text-sm font-medium text-foreground">
              {highlight}
            </p>
          ))}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3 text-sm text-muted">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.key === "enterprise" ? (
        <p className="mb-4 text-sm text-muted">
          Need custom onboarding?{" "}
          <span className="font-medium text-foreground">Contact Sales</span>
        </p>
      ) : null}

      {canManage ? (
        <>
          {seatBlockMessage ? (
            <p className="mb-3 text-sm text-warning">{seatBlockMessage}</p>
          ) : null}
          {buttonDisabled && disabledReasons.length > 0 ? (
            <ul className="mb-3 space-y-1 text-sm text-muted">
              {disabledReasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          ) : null}
          <Button            type="button"
            className="w-full"
            variant={isCurrent ? "secondary" : isRecommended ? "primary" : "secondary"}
            disabled={buttonDisabled}
            loading={isLoading}
            loadingText="Redirecting…"
            onClick={onSelect}
          >
            {getPlanActionButtonLabel(action)}
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-muted">
          {isCurrent
            ? "Your organization is on this plan."
            : "Organization owners and admins can change plans."}
        </p>
      )}
    </article>
  );
}
