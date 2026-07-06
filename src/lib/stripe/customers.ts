import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

type GetOrCreateCustomerInput = {
  organizationId: string;
  organizationName: string;
  email: string;
};

export const SUBSCRIPTION_CUSTOMER_REQUIRED_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

export function subscriptionRequiresCustomerId(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase();
  return Boolean(normalized && SUBSCRIPTION_CUSTOMER_REQUIRED_STATUSES.has(normalized));
}

export type EnsureSubscriptionCustomerInput = {
  organizationId: string;
  organizationName?: string;
  email?: string;
  status?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerIdHint?: string | null;
};

export type EnsureSubscriptionCustomerResult = {
  stripeCustomerId: string | null;
  created: boolean;
  repaired: boolean;
};

type SubscriptionRow = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
};

async function loadSubscriptionRow(organizationId: string): Promise<SubscriptionRow | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load billing profile.");
  }

  return (data as SubscriptionRow | null) ?? null;
}

async function resolveCustomerFromStripeSubscription(
  subscriptionId: string,
): Promise<string | null> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customer = subscription.customer;

  return typeof customer === "string" ? customer : customer?.id ?? null;
}

async function findStripeCustomerByOrganizationId(
  organizationId: string,
): Promise<string | null> {
  const stripe = getStripeClient();

  try {
    const result = await stripe.customers.search({
      query: `metadata['organization_id']:'${organizationId}'`,
      limit: 1,
    });

    return result.data[0]?.id ?? null;
  } catch (error) {
    console.warn("[stripe] customer metadata search failed", {
      organizationId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function createStripeCustomerForOrganization(input: {
  organizationId: string;
  organizationName: string;
  email: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.organizationName,
    metadata: {
      organization_id: input.organizationId,
    },
  });

  return customer.id;
}

/** Persist customer id without overwriting subscription fields or status. */
async function persistStripeCustomerId(
  organizationId: string,
  stripeCustomerId: string,
  statusFallback: string | null | undefined,
): Promise<boolean> {
  const admin = createAdminClient();
  const existing = await loadSubscriptionRow(organizationId);

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id === stripeCustomerId;
  }

  if (existing) {
    const { data, error } = await admin
      .from("organization_subscriptions")
      .update({ stripe_customer_id: stripeCustomerId } as never)
      .eq("organization_id", organizationId)
      .is("stripe_customer_id", null)
      .select("stripe_customer_id")
      .maybeSingle();

    if (error) {
      throw new Error("Unable to store Stripe customer.");
    }

    if (data) {
      return true;
    }

    const refreshed = await loadSubscriptionRow(organizationId);
    return refreshed?.stripe_customer_id === stripeCustomerId;
  }

  const { error: insertError } = await admin.from("organization_subscriptions").insert({
    organization_id: organizationId,
    stripe_customer_id: stripeCustomerId,
    status: statusFallback?.trim() || "inactive",
  } as never);

  if (insertError) {
    throw new Error("Unable to store Stripe customer.");
  }

  return true;
}

/**
 * Guarantee a Stripe customer id for billable subscription states.
 * Idempotent: reuses DB, subscription, metadata search, or creates once.
 */
export async function ensureSubscriptionCustomer(
  input: EnsureSubscriptionCustomerInput,
): Promise<EnsureSubscriptionCustomerResult> {
  const row = await loadSubscriptionRow(input.organizationId);
  const effectiveStatus = input.status ?? row?.status ?? null;

  if (row?.stripe_customer_id) {
    return {
      stripeCustomerId: row.stripe_customer_id,
      created: false,
      repaired: false,
    };
  }

  if (!subscriptionRequiresCustomerId(effectiveStatus)) {
    return {
      stripeCustomerId: null,
      created: false,
      repaired: false,
    };
  }

  const subscriptionId = input.stripeSubscriptionId ?? row?.stripe_subscription_id ?? null;
  let resolvedCustomerId = input.stripeCustomerIdHint?.trim() || null;
  let created = false;

  if (!resolvedCustomerId && subscriptionId) {
    resolvedCustomerId = await resolveCustomerFromStripeSubscription(subscriptionId);
  }

  if (!resolvedCustomerId) {
    resolvedCustomerId = await findStripeCustomerByOrganizationId(input.organizationId);
  }

  if (!resolvedCustomerId) {
    const organizationName = input.organizationName?.trim();
    const email = input.email?.trim();

    if (!organizationName || !email) {
      console.warn("[stripe] unable to ensure customer — missing org contact context", {
        organizationId: input.organizationId,
        status: effectiveStatus,
      });
      return {
        stripeCustomerId: null,
        created: false,
        repaired: false,
      };
    }

    resolvedCustomerId = await createStripeCustomerForOrganization({
      organizationId: input.organizationId,
      organizationName,
      email,
    });
    created = true;
  }

  const repaired = await persistStripeCustomerId(
    input.organizationId,
    resolvedCustomerId,
    effectiveStatus,
  );

  if (!repaired) {
    const refreshed = await loadSubscriptionRow(input.organizationId);
    return {
      stripeCustomerId: refreshed?.stripe_customer_id ?? resolvedCustomerId,
      created: false,
      repaired: Boolean(refreshed?.stripe_customer_id),
    };
  }

  console.info("[stripe] ensured subscription customer", {
    organizationId: input.organizationId,
    stripeCustomerId: resolvedCustomerId,
    created,
    status: effectiveStatus,
  });

  return {
    stripeCustomerId: resolvedCustomerId,
    created,
    repaired: true,
  };
}

/** Resolve or create a Stripe customer for an organization. */
export async function getOrCreateStripeCustomer(
  input: GetOrCreateCustomerInput,
): Promise<string> {
  const ensured = await ensureSubscriptionCustomer({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    email: input.email,
    status: "incomplete",
  });

  if (ensured.stripeCustomerId) {
    return ensured.stripeCustomerId;
  }

  const stripeCustomerId = await createStripeCustomerForOrganization(input);
  await persistStripeCustomerId(input.organizationId, stripeCustomerId, "inactive");

  return stripeCustomerId;
}

/** Look up organization id from a Stripe customer id. */
export async function getOrganizationIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error("[stripe] customer lookup failed:", error.message);
    return null;
  }

  return (data as { organization_id: string } | null)?.organization_id ?? null;
}
