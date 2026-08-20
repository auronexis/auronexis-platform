import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { listCustomerInvoices, listIgnoredStripeInvoiceIds } from "@/lib/billing/invoices";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { getBillingOverview, getOrganizationSubscription } from "@/lib/billing/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import { evaluateCheckoutGuard } from "@/lib/billing/checkout-guards";

/** Enforce checkout rules before creating a provider checkout session. */
export async function assertCheckoutAllowed(
  session: SessionContext,
  targetPlanKey: PlanKey,
): Promise<void> {
  const [overview, invoices, ignoredStripeInvoiceIds, subscription] = await Promise.all([
    getBillingOverview(session),
    listCustomerInvoices(session, 24),
    listIgnoredStripeInvoiceIds(session.organization.id),
    getOrganizationSubscription(session),
  ]);

  const activeProvider = getOrganizationBillingProvider({
    organizationId: session.organization.id,
    subscription,
  });

  const result = evaluateCheckoutGuard({
    overview,
    invoices,
    targetPlanKey,
    ignoredStripeInvoiceIds,
    activeProvider,
  });

  if (!result.allowed) {
    throw new Error(result.reason ?? "Checkout is not available for this plan.");
  }
}
