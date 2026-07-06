import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { listCustomerInvoices } from "@/lib/billing/invoices";
import { getBillingOverview } from "@/lib/billing/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import { evaluateCheckoutGuard } from "@/lib/billing/checkout-guards";

/** Enforce checkout rules before creating a Stripe Checkout session. */
export async function assertCheckoutAllowed(
  session: SessionContext,
  targetPlanKey: PlanKey,
): Promise<void> {
  const [overview, invoices] = await Promise.all([
    getBillingOverview(session),
    listCustomerInvoices(session, 24),
  ]);

  const result = evaluateCheckoutGuard({
    overview,
    invoices,
    targetPlanKey,
  });

  if (!result.allowed) {
    throw new Error(result.reason ?? "Checkout is not available for this plan.");
  }
}
