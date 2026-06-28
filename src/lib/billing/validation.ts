import type { PlanKey } from "@/lib/billing/plans";
import type { UsageMetricKey } from "@/lib/billing/types";

const DISCOUNT_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateDiscountCodeFormat(code: string): string {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    throw new Error("Enter a discount code.");
  }
  if (!DISCOUNT_CODE_PATTERN.test(normalized)) {
    throw new Error("Discount code must be 3–32 letters, numbers, underscores, or hyphens.");
  }
  return normalized;
}

export function validateUsageQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Usage quantity must be a non-negative number.");
  }
  return quantity;
}

export function validateMetricKey(metric: string): UsageMetricKey {
  const allowed: UsageMetricKey[] = [
    "ai_generations",
    "ai_tokens",
    "api_requests",
    "automation_executions",
    "connector_syncs",
    "workflow_executions",
    "reports_generated",
    "reports_published",
    "storage_mb",
    "active_users",
    "active_clients",
    "portal_users",
    "email_sends",
  ];

  if (!allowed.includes(metric as UsageMetricKey)) {
    throw new Error(`Unsupported usage metric: ${metric}`);
  }

  return metric as UsageMetricKey;
}

export function validatePlanTransition(fromPlan: PlanKey, toPlan: PlanKey): void {
  if (fromPlan === toPlan) {
    return;
  }
}

export function sanitizeBillingMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
