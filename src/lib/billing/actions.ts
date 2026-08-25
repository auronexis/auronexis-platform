"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { assertCheckoutAllowed } from "@/lib/billing/checkout-guards.server";
import { resolveCheckoutEligibility } from "@/lib/billing/checkout-eligibility";
import { trackBillingLifecycleEvent } from "@/lib/analytics/billing-lifecycle";
import { openCustomerPortal } from "@/lib/billing/customer-portal";
import {
  isExpectedPlanChangeError,
  isExpectedPortalUnavailableError,
  sanitizeBillingCustomerError,
} from "@/lib/billing/errors";
import { BILLING_PROMO_MESSAGES, formatPromoValidationSuccess } from "@/lib/billing/messages";
import { validateDiscountCode } from "@/lib/billing/discounts";
import { calculateProrationPreview } from "@/lib/billing/proration";
import { getBillingOverview } from "@/lib/billing/queries";
import { isInternalPlan } from "@/lib/billing/provider-types";
import type { PlanKey } from "@/lib/billing/plans";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import { BILLING_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";
import {
  createMollieProductionFirstPayment,
  isMollieProductionCheckoutConfigured,
} from "@/lib/billing/providers/mollie/production-checkout";
import { isMollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import {
  cancelMollieOrganizationSubscription,
  cancelMollieScheduledPlanChange,
  scheduleMollieOrganizationDowngrade,
} from "@/lib/billing/providers/mollie/lifecycle";
import { withdrawMollieOrganizationSubscriptionCancellation } from "@/lib/billing/providers/mollie/cancellation-withdrawal";
import { createMollieUpgradePaymentCheckout } from "@/lib/billing/providers/mollie/upgrade-payment";
import { formatPlanChangeScheduledSuccessMessage, formatUpgradePaymentCheckoutMessage } from "@/lib/billing/plan-change";
import {
  formatPlanChangeCanceledSuccessMessage,
  formatSubscriptionCancellationScheduledSuccessMessage,
  formatSubscriptionCancellationWithdrawnSuccessMessage,
  resolveSubscriptionEmailPlanName,
} from "@/lib/billing/subscription-management";
import { formatBillingDate } from "@/lib/billing/types";
import { sendPlanChangeScheduledEmail } from "@/lib/email/plan-change";
import {
  sendPlanChangeCanceledEmail,
  sendSubscriptionCancellationScheduledEmail,
  sendSubscriptionCancellationWithdrawnEmail,
} from "@/lib/email/subscription-management";
import { resolvePrimaryBillingRecipientForEmail } from "@/lib/email/billing-recipient";
import { getPlanByKey } from "@/lib/billing/plans";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  buildCheckoutContractSummary,
  buildCheckoutContractSummaryAcceptanceEvidence,
  buildB2bEntrepreneurAcceptanceEvidence,
  buildDpaAcceptanceEvidence,
  buildTermsAcceptanceEvidence,
  type CheckoutContractSummary,
} from "@/lib/billing/contracting";
import { persistContractAcceptance } from "@/lib/billing/contract-acceptance";
import {
  getOrganizationBillingIdentity,
  upsertOrganizationBillingIdentity,
} from "@/lib/billing/billing-identity";
import { determineTaxPolicy } from "@/lib/billing/tax-policy";
import { resolveVatIdTechnicalState } from "@/lib/billing/vat-id-status";
import { normalizeVatId, validateVatIdWithVies } from "@/lib/billing/vies";
import { LEGAL_COMPANY_NAME } from "@/lib/company/company-information";
import { recordActivityEvent } from "@/lib/activity/record";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingActionState = {
  error?: string;
  success?: string;
};

export type CheckoutContractInput = {
  termsAccepted: boolean;
  b2bEntrepreneurConfirmed: boolean;
  countryCode: string;
  vatId?: string;
};

export type CheckoutActionResult = BillingActionState & {
  mollieCheckout?: {
    checkoutUrl: string;
    checkoutAttemptId: string;
    pendingSyncMessage: string;
  };
  contractSummary?: CheckoutContractSummary;
};

const planKeySchema = z.enum(["starter", "professional", "business", "enterprise"]);

const checkoutContractSchema = z.object({
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "You must accept the Terms to continue.",
  }),
  b2bEntrepreneurConfirmed: z.boolean().refine((value) => value === true, {
    message: "Business / professional purchase confirmation is required for B2B checkout.",
  }),
  countryCode: z.string().min(2).max(8),
  vatId: z.string().optional(),
});

/** Build checkout contract summary before Mollie redirect. */
export async function prepareCheckoutContractSummaryAction(
  planKey: string,
): Promise<{
  error?: string;
  summary?: CheckoutContractSummary;
  /** Prefill from persisted org billing identity — never from browser locale. */
  identityDefaults?: { countryCode: string; vatId: string };
}> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }
  const parsed = planKeySchema.safeParse(planKey);
  if (!parsed.success || parsed.data === "starter" || !isInternalPlan(parsed.data)) {
    return { error: "Invalid subscription plan selected." };
  }
  const plan = getPlanByKey(parsed.data);
  const identity = await getOrganizationBillingIdentity(session.organization.id);
  const countryCode = identity?.countryCode?.trim().toUpperCase() || "DE";
  return {
    summary: buildCheckoutContractSummary({
      planKey: plan.key,
      planName: plan.name,
      currency: plan.currency,
      amountMinor: plan.amountMinor,
      priceVersion: plan.priceVersion,
      sellerName: LEGAL_COMPANY_NAME,
      organizationName: session.organization.name,
    }),
    identityDefaults: {
      countryCode: ["DE", "AT", "NL", "FR", "BE"].includes(countryCode) ? countryCode : "OTHER",
      vatId: identity?.vatId ?? "",
    },
  };
}

async function enforceCheckoutContractAndTax(input: {
  organizationId: string;
  organizationName: string;
  billingEmail: string;
  userId: string;
  planKey: string;
  amountMinor: number;
  currency: string;
  priceVersion: string;
  contract: CheckoutContractInput;
}): Promise<{ error?: string }> {
  const parsed = checkoutContractSchema.safeParse(input.contract);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Contract acceptance is incomplete." };
  }

  const countryCode =
    parsed.data.countryCode === "OTHER" ? null : parsed.data.countryCode.trim().toUpperCase();

  const vatRaw = parsed.data.vatId?.trim() || null;
  if (vatRaw && !normalizeVatId(vatRaw)) {
    return { error: "VAT ID format is invalid. Use a country prefix plus number (e.g. DE123456789)." };
  }

  const vies =
    countryCode && countryCode !== "DE" && vatRaw
      ? await validateVatIdWithVies(vatRaw)
      : { status: "not_checked" as const, checkedAt: new Date().toISOString() };

  const vatTechnicalState = resolveVatIdTechnicalState({
    vatId: vatRaw,
    viesStatus: vies.status,
  });
  if (vatTechnicalState === "INVALID" && vatRaw) {
    return { error: "VAT ID could not be accepted. Check the format or contact sales." };
  }

  const determination = determineTaxPolicy({
    customerCountryCode: countryCode,
    vatId: vatRaw,
    viesStatus: vies.status,
    isB2bEntrepreneurConfirmed: true,
  });

  if (determination.blocksCheckout) {
    return {
      error:
        determination.reasonCode === "eu_b2b_reverse_charge_legend_pending_counsel"
          ? "Cross-border EU B2B checkout requires manual review until reverse-charge invoice wording is counsel-approved. Contact sales."
          : "Checkout is blocked until billing country / VAT details can be confirmed. Contact sales for manual review.",
    };
  }

  const existing = await getOrganizationBillingIdentity(input.organizationId);
  await upsertOrganizationBillingIdentity({
    organizationId: input.organizationId,
    legalName: existing?.legalName?.trim() || input.organizationName.trim() || null,
    billingEmail: existing?.billingEmail?.trim() || input.billingEmail.trim() || null,
    countryCode,
    addressLine1: existing?.addressLine1 ?? null,
    addressLine2: existing?.addressLine2 ?? null,
    postalCode: existing?.postalCode ?? null,
    city: existing?.city ?? null,
    vatId: vatRaw,
    viesStatus: vies.status,
    viesCheckedAt: vies.checkedAt,
  });

  const now = new Date().toISOString();
  await persistContractAcceptance({
    organizationId: input.organizationId,
    userId: input.userId,
    evidence: buildTermsAcceptanceEvidence({ acceptedAt: now, source: "checkout" }),
  });
  await persistContractAcceptance({
    organizationId: input.organizationId,
    userId: input.userId,
    evidence: buildB2bEntrepreneurAcceptanceEvidence({ acceptedAt: now, source: "checkout" }),
  });
  await persistContractAcceptance({
    organizationId: input.organizationId,
    userId: input.userId,
    evidence: buildDpaAcceptanceEvidence({ acceptedAt: now, source: "checkout" }),
  });
  await persistContractAcceptance({
    organizationId: input.organizationId,
    userId: input.userId,
    evidence: buildCheckoutContractSummaryAcceptanceEvidence({
      acceptedAt: now,
      source: "checkout",
      planKey: input.planKey,
      priceVersion: input.priceVersion,
      amountMinor: input.amountMinor,
      currency: input.currency,
    }),
  });

  void recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: input.userId,
    entityType: "organization",
    entityId: input.organizationId,
    action: "billing_identity_updated",
    title: "Billing identity updated",
    metadata: { source: "checkout" },
  });
  void recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: input.userId,
    entityType: "organization",
    entityId: input.organizationId,
    action: "checkout_b2b_acknowledgement_captured",
    title: "Checkout B2B acknowledgement captured",
    metadata: { source: "checkout", planKey: input.planKey },
  });

  return {};
}

/** Create checkout for the active billing provider. Owner/Admin only. */
export async function createCheckoutSessionAction(
  planKey: string,
  contract?: CheckoutContractInput,
): Promise<CheckoutActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = planKeySchema.safeParse(planKey);

  if (!parsed.success) {
    return { error: "Invalid subscription plan selected." };
  }

  if (parsed.data === "starter") {
    return { error: "Invalid subscription plan selected." };
  }

  if (!isInternalPlan(parsed.data)) {
    return { error: "Invalid subscription plan selected." };
  }

  try {
    await assertCheckoutAllowed(session, parsed.data);

    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    const eligibility = resolveCheckoutEligibility({
      organizationId: session.organization.id,
      subscription,
      targetPlanKey: parsed.data,
      resolvedProvider: orgProvider,
    });

    if (!eligibility.allowed) {
      return { error: eligibility.reason };
    }

    if (eligibility.provider === "mollie") {
      if (parsed.data === "enterprise") {
        return {
          error: "Enterprise is manual-only. Contact sales to arrange an enterprise plan.",
        };
      }

      if (!isMollieSelfServePlanKey(parsed.data)) {
        return { error: "Invalid subscription plan selected." };
      }

      if (!isMollieProductionCheckoutConfigured()) {
        return {
          error:
            "Mollie checkout is not configured for this workspace. Contact support if you expected Mollie billing.",
        };
      }

      if (!contract) {
        return { error: "Contract acceptance is required before Mollie checkout." };
      }

      const plan = getPlanByKey(parsed.data);

      const contractGate = await enforceCheckoutContractAndTax({
        organizationId: session.organization.id,
        organizationName: session.organization.name,
        billingEmail: session.email,
        userId: session.user.id,
        planKey: plan.key,
        amountMinor: plan.amountMinor,
        currency: plan.currency,
        priceVersion: plan.priceVersion,
        contract,
      });
      if (contractGate.error) {
        return { error: contractGate.error };
      }
      const admin = createAdminClient();
      await admin
        .from("organization_subscriptions")
        .update({
          billing_currency: plan.currency,
          catalog_price_version: plan.priceVersion,
          catalog_amount_minor: plan.amountMinor,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("organization_id", session.organization.id);

      // Existing usable Mollie subscription → plan change (upgrade payment or downgrade schedule).
      if (eligibility.code === "allowed_mollie_plan_change") {
        const currentPlanKey = subscription?.provider_price_id;
        const currentPlan = getPlanByKey(
          (currentPlanKey && isMollieSelfServePlanKey(currentPlanKey)
            ? currentPlanKey
            : "professional") as PlanKey,
        );
        const targetPlan = getPlanByKey(parsed.data);

        if (targetPlan.order > currentPlan.order) {
          const upgradeCheckout = await createMollieUpgradePaymentCheckout({
            organizationId: session.organization.id,
            targetPlanKey: parsed.data,
          });

          return {
            success: formatUpgradePaymentCheckoutMessage({
              targetPlanName: targetPlan.name,
              formattedNetDue: upgradeCheckout.proration.formattedNetDue,
            }),
            mollieCheckout: {
              checkoutUrl: upgradeCheckout.checkoutUrl,
              checkoutAttemptId: upgradeCheckout.checkoutAttemptId,
              pendingSyncMessage: upgradeCheckout.pendingSyncMessage,
            },
          };
        }

        const changeResult = await scheduleMollieOrganizationDowngrade({
          organizationId: session.organization.id,
          targetPlanKey: parsed.data,
        });

        void sendPlanChangeScheduledEmail({
          organizationId: session.organization.id,
          organizationName: session.organization.name,
          userId: session.user.id,
          recipientEmail: session.email,
          previousPlanKey: changeResult.previousPlanKey,
          targetPlanKey: changeResult.targetPlanKey,
          changeType: changeResult.changeType,
          effectiveAt: changeResult.pendingPlanEffectiveAt,
          providerChangeReference: changeResult.providerChangeReference,
        }).catch((emailError) => {
          console.error("[billing][plan-change] scheduled email failed", {
            message: emailError instanceof Error ? emailError.message : String(emailError),
          });
        });

        return {
          success: formatPlanChangeScheduledSuccessMessage({
            currentPlanName: currentPlan.name,
            targetPlanName: targetPlan.name,
            changeType: changeResult.changeType,
            effectiveAtLabel: formatBillingDate(changeResult.pendingPlanEffectiveAt),
          }),
        };
      }

      const checkout = await createMollieProductionFirstPayment({
        organizationId: session.organization.id,
        organizationName: session.organization.name,
        ownerEmail: session.email,
        planKey: parsed.data,
      });

      return {
        success: checkout.pendingSyncMessage,
        mollieCheckout: {
          checkoutUrl: checkout.checkoutUrl,
          checkoutAttemptId: checkout.checkoutAttemptId,
          pendingSyncMessage: checkout.pendingSyncMessage,
        },
      };
    }

    return {
      error:
        "Checkout is only available via Mollie. Contact support if you expected billing to be available for this workspace.",
    };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    if (isExpectedPlanChangeError(error)) {
      console.info("[billing][plan-change] request rejected", {
        message: error instanceof Error ? error.message : String(error),
      });
    } else {
      console.error("[billing][checkout] failed", error);
    }
    return {
      error: sanitizeBillingCustomerError(error, "Unable to start checkout."),
    };
  }
}

/** Cancel scheduled Mollie plan change — Owner/Admin only. */
export async function cancelMollieScheduledPlanChangeAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  try {
    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    if (orgProvider !== "mollie") {
      return {
        error: "Scheduled plan change cancellation is only available for Mollie-billed workspaces.",
      };
    }

    const result = await cancelMollieScheduledPlanChange({
      organizationId: session.organization.id,
    });

    const currentPlanName = resolveSubscriptionEmailPlanName(result.currentPlanKey);

    void sendPlanChangeCanceledEmail({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      userId: session.user.id,
      recipientEmail: session.email,
      currentPlanKey: result.currentPlanKey,
      canceledPlanKey: result.canceledPendingPlanKey,
      changeType: result.changeType,
      providerChangeReference: result.providerChangeReference,
    }).catch((emailError) => {
      console.error("[billing][plan-change-cancel] email failed", {
        message: emailError instanceof Error ? emailError.message : String(emailError),
      });
    });

    return {
      success: formatPlanChangeCanceledSuccessMessage({
        currentPlanName,
        changeType: result.changeType,
      }),
    };
  } catch (error) {
    if (isExpectedPlanChangeError(error)) {
      console.info("[billing][plan-change-cancel] request rejected", {
        message: error instanceof Error ? error.message : String(error),
      });
    } else {
      console.error("[billing][plan-change-cancel] failed", error);
    }
    return {
      error: sanitizeBillingCustomerError(error, "Unable to cancel scheduled plan change."),
    };
  }
}

/** Cancel Mollie subscription at period end — Owner/Admin only. */
export async function cancelMollieSubscriptionAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  try {
    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    if (orgProvider !== "mollie") {
      return {
        error: "Cancellation via this action is only available for Mollie-billed workspaces.",
      };
    }

    const result = await cancelMollieOrganizationSubscription({
      organizationId: session.organization.id,
    });

    const planName = resolveSubscriptionEmailPlanName(result.planKey);
    const accessUntilLabel = formatBillingDate(result.accessUntil);
    const billingRecipient = await resolvePrimaryBillingRecipientForEmail(session.organization.id);

    if (billingRecipient) {
      void sendSubscriptionCancellationScheduledEmail({
        organizationId: session.organization.id,
        organizationName: session.organization.name,
        userId: billingRecipient.userId,
        recipientEmail: billingRecipient.email,
        planKey: result.planKey,
        accessUntil: result.accessUntil,
        providerSubscriptionId: result.providerSubscriptionId,
      }).catch((emailError) => {
        console.error("[billing][subscription-cancel] email failed", {
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });
    } else {
      console.error("[billing][subscription-cancel] no billing recipient for cancellation email", {
        organizationId: session.organization.id,
      });
    }

    return {
      success: formatSubscriptionCancellationScheduledSuccessMessage({
        planName,
        accessUntilLabel,
      }),
    };
  } catch (error) {
    console.error("[billing][subscription-cancel] failed", error);
    return {
      error: sanitizeBillingCustomerError(error, "Unable to cancel subscription."),
    };
  }
}

/** Withdraw scheduled Mollie cancellation — Owner/Admin only. No immediate charge. */
export async function withdrawMollieSubscriptionCancellationAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  try {
    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    if (orgProvider !== "mollie") {
      return {
        error: "Cancellation withdrawal is only available for Mollie-billed workspaces.",
      };
    }

    const result = await withdrawMollieOrganizationSubscriptionCancellation({
      organizationId: session.organization.id,
    });

    const planName = resolveSubscriptionEmailPlanName(result.planKey);
    const renewalLabel = formatBillingDate(result.renewalAt);
    const billingRecipient = await resolvePrimaryBillingRecipientForEmail(session.organization.id);

    if (billingRecipient) {
      void sendSubscriptionCancellationWithdrawnEmail({
        organizationId: session.organization.id,
        organizationName: session.organization.name,
        userId: billingRecipient.userId,
        recipientEmail: billingRecipient.email,
        planKey: result.planKey,
        renewalAt: result.renewalAt,
        providerSubscriptionId: result.providerSubscriptionId,
      }).catch((emailError) => {
        console.error("[billing][subscription-withdraw] email failed", {
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });
    } else {
      console.error("[billing][subscription-withdraw] no billing recipient for withdrawal email", {
        organizationId: session.organization.id,
      });
    }

    return {
      success: formatSubscriptionCancellationWithdrawnSuccessMessage({
        planName,
        renewalLabel,
      }),
    };
  } catch (error) {
    console.error("[billing][subscription-withdraw] failed", error);
    return {
      error: sanitizeBillingCustomerError(error, "Unable to keep subscription."),
    };
  }
}

/** Open the provider-specific customer portal — Owner/Admin only. */
export async function createPortalSessionAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  let portalUrl: string;

  try {
    portalUrl = await openCustomerPortal({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      email: session.email,
    });
  } catch (error) {
    if (isExpectedPortalUnavailableError(error)) {
      // Expected — Mollie does not expose a hosted customer portal in this integration.
      return {
        error: sanitizeBillingCustomerError(error, BILLING_PORTAL_UNAVAILABLE_MESSAGE),
      };
    }
    console.error(
      "[billing][portal] failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open billing portal."),
    };
  }

  void trackBillingLifecycleEvent("billing_portal_opened", {
    result: "success",
    source: "customer_portal",
  });

  redirect(portalUrl);
}

export async function validateDiscountCodeAction(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState & { preview?: Awaited<ReturnType<typeof validateDiscountCode>> }> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const code = String(formData.get("discountCode") ?? "");
  const planKey =
    (String(formData.get("planKey") ?? getDefaultPlanKey()) as PlanKey) || getDefaultPlanKey();
  const result = await validateDiscountCode(code, planKey);

  if (!result.valid) {
    if ("silent" in result && result.silent) {
      return {};
    }
    return { error: result.message || BILLING_PROMO_MESSAGES.NOT_APPLIED };
  }

  return {
    success: formatPromoValidationSuccess(result.code, result.formattedSavings),
    preview: result,
  };
}

export async function previewProrationAction(
  targetPlanKey: string,
): Promise<BillingActionState & { preview?: ReturnType<typeof calculateProrationPreview> }> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = planKeySchema.safeParse(targetPlanKey);
  if (!parsed.success) {
    return { error: "Invalid target plan." };
  }

  const overview = await getBillingOverview(session);
  const currentPlanKey = overview.currentPlanKey ?? getDefaultPlanKey();
  const periodStart = overview.subscription?.current_period_start
    ? new Date(overview.subscription.current_period_start)
    : new Date();
  const periodEnd = overview.subscription?.current_period_end
    ? new Date(overview.subscription.current_period_end)
    : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const preview = calculateProrationPreview({
    fromPlanKey: currentPlanKey,
    toPlanKey: parsed.data,
    periodStart,
    periodEnd,
  });

  return {
    success: `Estimated ${preview.direction} adjustment: ${preview.formattedNetDue}`,
    preview,
  };
}
