import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

type GetOrCreateCustomerInput = {
  organizationId: string;
  organizationName: string;
  email: string;
};

/** Resolve or create a Stripe customer for an organization. */
export async function getOrCreateStripeCustomer(
  input: GetOrCreateCustomerInput,
): Promise<string> {
  const admin = createAdminClient();

  const { data: existingData, error: existingError } = await admin
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to load billing profile.");
  }

  const existing = existingData as { stripe_customer_id: string | null } | null;

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.organizationName,
    metadata: {
      organization_id: input.organizationId,
    },
  });

  const { error: upsertError } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: input.organizationId,
      stripe_customer_id: customer.id,
      status: "inactive",
    } as never,
    { onConflict: "organization_id" },
  );

  if (upsertError) {
    throw new Error("Unable to store Stripe customer.");
  }

  return customer.id;
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
