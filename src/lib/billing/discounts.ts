import "server-only";

import { getDefaultPlanKey } from "@/lib/plans/features";
import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { BILLING_PROMO_MESSAGES } from "@/lib/billing/messages";
import type { DiscountPreview, ValidatedDiscount } from "@/lib/billing/types";
import { normalizeDiscountCode, validateDiscountCodeFormat } from "@/lib/billing/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type DiscountRow = {
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  percentage_off: number | null;
  amount_off: number | null;
  currency: string;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  active: boolean;
};

function formatSavings(row: DiscountRow, planPriceCents: number): string {
  if (row.discount_type === "percentage" && row.percentage_off) {
    const savings = Math.round(planPriceCents * (row.percentage_off / 100));
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: row.currency.toUpperCase(),
    }).format(savings / 100);
  }

  if (row.discount_type === "fixed" && row.amount_off) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: row.currency.toUpperCase(),
    }).format(row.amount_off / 100);
  }

  return "—";
}

function mapDiscountPreview(row: DiscountRow, planPriceCents: number): DiscountPreview {
  return {
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    percentageOff: row.percentage_off,
    amountOff: row.amount_off,
    formattedSavings: formatSavings(row, planPriceCents),
    expiresAt: row.expires_at,
    remainingRedemptions:
      row.max_redemptions === null ? null : Math.max(0, row.max_redemptions - row.redemption_count),
  };
}

function applyDiscount(planPriceCents: number, row: DiscountRow): number {
  if (row.discount_type === "percentage" && row.percentage_off) {
    return Math.max(0, Math.round(planPriceCents * (1 - row.percentage_off / 100)));
  }

  if (row.discount_type === "fixed" && row.amount_off) {
    return Math.max(0, planPriceCents - row.amount_off);
  }

  return planPriceCents;
}

export async function listActiveDiscountPreviews(planKey: PlanKey): Promise<DiscountPreview[]> {
  const admin = createAdminClient();
  const plan = safeGetPlanByKey(planKey) ?? safeGetPlanByKey(getDefaultPlanKey());
  if (!plan) {
    return [];
  }
  const planPriceCents = plan.priceMonthly * 100;
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("discount_codes")
    .select("*")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return [];
  }

  return ((data ?? []) as DiscountRow[]).map((row) => mapDiscountPreview(row, planPriceCents));
}

export async function validateDiscountCode(
  code: string,
  planKey: PlanKey,
): Promise<ValidatedDiscount | { valid: false; message: string; silent?: boolean }> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { valid: false, message: "", silent: true };
  }

  let normalized: string;
  try {
    normalized = validateDiscountCodeFormat(trimmed);
  } catch {
    return { valid: false, message: BILLING_PROMO_MESSAGES.INVALID };
  }

  const admin = createAdminClient();
  const plan = safeGetPlanByKey(planKey) ?? safeGetPlanByKey(getDefaultPlanKey());
  if (!plan) {
    return { valid: false, message: BILLING_PROMO_MESSAGES.INVALID };
  }
  const planPriceCents = plan.priceMonthly * 100;

  const { data, error } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, message: BILLING_PROMO_MESSAGES.INVALID };
  }

  const row = data as DiscountRow;

  if (!row.active) {
    return { valid: false, message: BILLING_PROMO_MESSAGES.UNAVAILABLE };
  }

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false, message: BILLING_PROMO_MESSAGES.UNAVAILABLE };
  }

  if (row.max_redemptions !== null && row.redemption_count >= row.max_redemptions) {
    return { valid: false, message: BILLING_PROMO_MESSAGES.UNAVAILABLE };
  }

  const preview = mapDiscountPreview(row, planPriceCents);
  const discountedPriceCents = applyDiscount(planPriceCents, row);

  return {
    ...preview,
    valid: true,
    appliedToPlanKey: planKey,
    originalPriceCents: planPriceCents,
    discountedPriceCents,
  };
}

export async function incrementDiscountRedemption(code: string): Promise<void> {
  const normalized = normalizeDiscountCode(code);
  const admin = createAdminClient();
  const { data } = await admin.from("discount_codes").select("redemption_count").eq("code", normalized).maybeSingle();
  const current = (data as { redemption_count: number } | null)?.redemption_count ?? 0;

  await admin
    .from("discount_codes")
    .update({ redemption_count: current + 1 } as never)
    .eq("code", normalized);
}

export function previewDiscountForCheckout(
  validation: ValidatedDiscount,
): { code: string; savingsCents: number; discountedPriceCents: number } {
  return {
    code: validation.code,
    savingsCents: validation.originalPriceCents - validation.discountedPriceCents,
    discountedPriceCents: validation.discountedPriceCents,
  };
}
