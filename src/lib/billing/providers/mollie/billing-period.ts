/**
 * Canonical Mollie billing-period semantics for organization_subscriptions.
 *
 * Mollie fields:
 * - createdAt / startDate / paidAt → evidence for period start (never nextPaymentDate)
 * - nextPaymentDate → renewal boundary = current_period_end
 *
 * Invariant for active subscriptions used in proration:
 * current_period_start NOT NULL, current_period_end NOT NULL, end > start.
 */

/** Normalize Mollie date-only boundaries to a stable UTC instant. */
export function normalizeMolliePeriodBoundary(value: string, bound: "start" | "end"): number {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(bound === "end" ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`);
  }
  return Date.parse(trimmed);
}

/** Coerce Mollie date-only or ISO strings into a stored timestamptz-friendly ISO string. */
export function coerceMolliePeriodInstant(
  value: string | null | undefined,
  bound: "start" | "end",
): string | null {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return bound === "end" ? `${trimmed}T00:00:00.000Z` : `${trimmed}T00:00:00.000Z`;
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) {
    return null;
  }
  return new Date(ms).toISOString();
}

export function isValidMollieBillingPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
): boolean {
  if (!start || !end) {
    return false;
  }
  const startMs = normalizeMolliePeriodBoundary(start, "start");
  const endMs = normalizeMolliePeriodBoundary(end, "end");
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
}

export type MollieBillingPeriodResolution = {
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  advanced: boolean;
};

/**
 * Resolve period bounds for paid subscription events (renewal webhook / sync).
 *
 * - renewal + nextPaymentDate strictly after existing end → roll start forward once
 * - otherwise preserve a valid existing start; never set start = nextPaymentDate
 * - end always tracks nextPaymentDate when present
 */
export function resolveMollieBillingPeriodUpdate(input: {
  existingStart: string | null | undefined;
  existingEnd: string | null | undefined;
  nextPaymentDate: string | null | undefined;
  mode: "renewal" | "sync";
}): MollieBillingPeriodResolution {
  const nextEnd = coerceMolliePeriodInstant(input.nextPaymentDate, "end");
  const existingStart = input.existingStart?.trim() ? input.existingStart.trim() : null;
  const existingEnd = input.existingEnd?.trim() ? input.existingEnd.trim() : null;
  const periodEnd = nextEnd ?? existingEnd;

  if (!periodEnd) {
    return {
      currentPeriodStart: existingStart,
      currentPeriodEnd: null,
      advanced: false,
    };
  }

  const endMs = normalizeMolliePeriodBoundary(periodEnd, "end");
  const existingEndMs = existingEnd
    ? normalizeMolliePeriodBoundary(existingEnd, "end")
    : Number.NaN;
  const existingValid = isValidMollieBillingPeriod(existingStart, existingEnd);

  if (
    input.mode === "renewal" &&
    existingValid &&
    Number.isFinite(endMs) &&
    Number.isFinite(existingEndMs) &&
    endMs > existingEndMs
  ) {
    return {
      currentPeriodStart: coerceMolliePeriodInstant(existingEnd, "end"),
      currentPeriodEnd: periodEnd,
      advanced: true,
    };
  }

  // Sync / non-advancing path: never overwrite a valid start with nextPaymentDate.
  let periodStart = existingStart;
  if (periodStart && Number.isFinite(normalizeMolliePeriodBoundary(periodStart, "start"))) {
    const startMs = normalizeMolliePeriodBoundary(periodStart, "start");
    if (!(endMs > startMs)) {
      // Keep existing start for operator repair; do not invent nextPaymentDate as start.
      periodStart = existingStart;
    }
  }

  return {
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    advanced: false,
  };
}

/**
 * Initial period after mandate / first paid purchase.
 * Start = paidAt/now (or Mollie startDate); end = nextPaymentDate. Never start = nextPaymentDate.
 */
export function resolveMollieInitialBillingPeriod(input: {
  periodStart: string;
  nextPaymentDate: string | null | undefined;
}): { currentPeriodStart: string; currentPeriodEnd: string | null } {
  const start =
    coerceMolliePeriodInstant(input.periodStart, "start") ?? new Date().toISOString();
  const end = coerceMolliePeriodInstant(input.nextPaymentDate, "end");
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

export type MollieBillingPeriodRepairResult =
  | {
      repaired: true;
      alreadyValid: boolean;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      source: "existing" | "evidence";
    }
  | {
      repaired: false;
      reason: string;
    };

/**
 * Deterministic repair for collapsed/invalid periods.
 * Prefers preserving a still-valid existing start; otherwise uses explicit evidence
 * (Mollie startDate/createdAt, transaction billing_period_start, payment paidAt).
 * Never invents start from nextPaymentDate alone.
 */
export function resolveMollieBillingPeriodRepair(input: {
  existingStart: string | null | undefined;
  existingEnd: string | null | undefined;
  nextPaymentDate: string | null | undefined;
  evidenceStarts?: Array<string | null | undefined>;
}): MollieBillingPeriodRepairResult {
  const periodEnd =
    coerceMolliePeriodInstant(input.nextPaymentDate, "end") ??
    coerceMolliePeriodInstant(input.existingEnd, "end");

  if (!periodEnd) {
    return { repaired: false, reason: "missing_period_end_evidence" };
  }

  if (isValidMollieBillingPeriod(input.existingStart, periodEnd)) {
    return {
      repaired: true,
      alreadyValid: isValidMollieBillingPeriod(input.existingStart, input.existingEnd),
      currentPeriodStart: coerceMolliePeriodInstant(input.existingStart, "start")!,
      currentPeriodEnd: periodEnd,
      source: "existing",
    };
  }

  const endMs = normalizeMolliePeriodBoundary(periodEnd, "end");
  const evidence = input.evidenceStarts ?? [];
  for (const candidate of evidence) {
    const start = coerceMolliePeriodInstant(candidate, "start");
    if (!start) {
      continue;
    }
    const startMs = normalizeMolliePeriodBoundary(start, "start");
    if (Number.isFinite(startMs) && endMs > startMs) {
      return {
        repaired: true,
        alreadyValid: false,
        currentPeriodStart: start,
        currentPeriodEnd: periodEnd,
        source: "evidence",
      };
    }
  }

  return { repaired: false, reason: "missing_period_start_evidence" };
}
