/** Customer-safe billing copy — never expose Stripe or internal identifiers. */

export const BILLING_PROMO_MESSAGES = {
  INVALID: "Invalid promo code",
  UNAVAILABLE: "Promotion unavailable",
  NOT_APPLIED: "No active promotion applied",
  UNABLE_TO_APPLY: "Unable to apply discount",
} as const;

export function formatPromoValidationSuccess(code: string, savings: string): string {
  return `Promotion ${code} applied — saves ${savings} on your selected plan.`;
}

export function formatForecastWarning(status: "warning" | "critical"): string {
  if (status === "critical") {
    return "Usage is approaching your plan limits. Review your usage dashboard for details.";
  }

  return "Usage is trending higher than usual. Review your usage dashboard for details.";
}

export function formatProrationSummary(input: {
  direction: string;
  toPlanKey: string;
  daysRemainingInPeriod: number;
  formattedNetDue: string;
}): string {
  const direction =
    input.direction === "upgrade"
      ? "Upgrade"
      : input.direction === "downgrade"
        ? "Downgrade"
        : "Plan change";

  return `${direction} to ${input.toPlanKey} · ${input.daysRemainingInPeriod} day(s) left in billing period · Estimated amount due: ${input.formattedNetDue}`;
}
