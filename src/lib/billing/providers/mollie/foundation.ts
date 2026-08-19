/**
 * Mollie Phase 1 foundation — mapping, correlation, and idempotency design.
 * No runtime payment creation in this phase; documents Phase 2+ contracts only.
 */

/** Mollie Customer.metadata — correlate to Auroranexis organization. */
export const MOLLIE_METADATA_ORGANIZATION_ID = "auroranexis_organization_id";

/** Mollie Customer/Subscription.metadata — internal plan key at checkout time. */
export const MOLLIE_METADATA_PLAN_KEY = "auroranexis_plan_key";

/** Mollie Payment.metadata — idempotency / correlation for first-payment → mandate flow. */
export const MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID = "auroranexis_checkout_attempt_id";

/**
 * Canonical business state (Auroranexis) vs provider state (Mollie):
 *
 * | Auroranexis (organization_subscriptions) | Mollie resource        |
 * |------------------------------------------|------------------------|
 * | organization_id                          | Customer.metadata      |
 * | billing_provider = 'mollie' (Phase 2+)   | —                      |
 * | provider_customer_id                     | Customer.id (cst_*)    |
 * | provider_subscription_id                 | Subscription.id (sub_*)|
 * | provider_price_id                        | Subscription amount/description or catalog ref |
 * | provider_status                          | Subscription.status    |
 * | status (normalized)                      | derived from Subscription + Payment webhooks |
 * | current_period_*                         | Subscription interval/next payment |
 * | sync_pending                             | true until webhook fetch confirms |
 *
 * Enterprise plans remain manual — no Mollie self-serve checkout (contact sales flow untouched).
 */

/**
 * Phase 2+ idempotency strategy (no payment creation in Phase 1):
 *
 * 1. Inbound webhooks: dedicated `mollie_webhook_events` ledger (provider + event id unique),
 *    mirroring fastspring_webhook_events. Always fetch authoritative object from Mollie API
 *    before mutating organization_subscriptions.
 * 2. Outbound charge/subscription creation: deterministic idempotency key =
 *    `${organizationId}:${checkoutAttemptId}` stored on Payment.metadata and checked before POST.
 * 3. Payload hash mismatch on redelivery → fail closed (same pattern as FastSpring).
 */

export type MollieFoundationPhase = "phase_1_foundation";

export const MOLLIE_FOUNDATION_PHASE: MollieFoundationPhase = "phase_1_foundation";

/**
 * Phase 2+ webhook contract (not implemented in Phase 1):
 * - POST /api/mollie/webhook — verify signature, enqueue idempotency, fetch resource from API.
 * - Never trust webhook body alone for subscription state mutations.
 */
