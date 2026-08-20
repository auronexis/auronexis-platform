/**
 * Mollie foundation — mapping, correlation, and idempotency design.
 */

/** Mollie Customer.metadata — correlate to Auroranexis organization. */
export const MOLLIE_METADATA_ORGANIZATION_ID = "auroranexis_organization_id";

/** Mollie Customer/Subscription.metadata — internal plan key at checkout time. */
export const MOLLIE_METADATA_PLAN_KEY = "auroranexis_plan_key";

/** Mollie Payment.metadata — idempotency / correlation for first-payment → mandate flow. */
export const MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID = "auroranexis_checkout_attempt_id";

/**
 * Payment/Customer metadata — routes webhook reconcile to TEST parallel table vs
 * canonical organization_subscriptions. Values: "test" | "production".
 */
export const MOLLIE_METADATA_BILLING_SURFACE = "auroranexis_billing_surface";

/**
 * Canonical business state (Auroranexis) vs provider state (Mollie):
 *
 * | Auroranexis (organization_subscriptions when Mollie) | Mollie resource        |
 * |------------------------------------------------------|------------------------|
 * | organization_id                                      | Customer.metadata      |
 * | billing_provider = mollie                            | (local)                |
 * | provider_customer_id                                 | Customer.id (cst_*)    |
 * | provider_subscription_id                             | Subscription.id (sub_*)|
 * | provider_price_id / plan_key                         | plan key (professional/business) |
 * | provider_status                                      | Subscription.status    |
 * | status (normalized)                                  | derived from Subscription + Payment |
 * | sync_pending                                         | true until subscription mapping confirmed |
 *
 * Phase 2 parallel test state remains in mollie_test_subscriptions — NEVER the
 * production source of truth and never grants entitlements by itself.
 * Enterprise plans remain manual — no Mollie self-serve checkout.
 */

/**
 * Idempotency strategy:
 *
 * 1. Inbound webhooks: dedicated `mollie_webhook_events` ledger (provider + event id unique),
 *    mirroring fastspring_webhook_events. Always fetch authoritative object from Mollie API
 *    before mutating storage.
 * 2. Outbound charge/subscription creation: deterministic idempotency key on POST.
 * 3. Payload hash mismatch on redelivery → fail closed (same pattern as FastSpring).
 * 4. Provider coexistence: Mollie never overwrites FastSpring organization_subscriptions rows.
 */

export type MollieFoundationPhase =
  | "phase_2_test_lifecycle"
  | "phase_3_production_integration";

export const MOLLIE_FOUNDATION_PHASE: MollieFoundationPhase = "phase_3_production_integration";

/**
 * Phase 3 webhook contract:
 * - POST /api/mollie/webhook — extract payment id, idempotency ledger, fetch resource from API.
 * - Never trust webhook body alone for subscription state mutations.
 * - Route by auroranexis_billing_surface: production → organization_subscriptions;
 *   test (default) → mollie_test_subscriptions.
 * - Never mutate FastSpring-backed organization_subscriptions rows.
 * - Entitlements activate only after verified usable Mollie subscription sync — never return page alone.
 */
