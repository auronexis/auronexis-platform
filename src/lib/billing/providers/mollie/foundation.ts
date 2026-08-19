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
 * Canonical business state (Auroranexis) vs provider state (Mollie):
 *
 * | Auroranexis (mollie_test_subscriptions) | Mollie resource        |
 * |-----------------------------------------|------------------------|
 * | organization_id                         | Customer.metadata      |
 * | provider_customer_id                    | Customer.id (cst_*)    |
 * | provider_subscription_id                | Subscription.id (sub_*)|
 * | provider_price_id / plan_key            | Subscription amount/description or catalog ref |
 * | provider_status                         | Subscription.status    |
 * | status (normalized)                     | derived from Subscription + Payment webhooks |
 * | sync_pending                            | true until webhook fetch confirms |
 *
 * Parallel test state in mollie_test_subscriptions — never organization_subscriptions or entitlements.
 * Enterprise plans remain manual — no Mollie self-serve checkout (contact sales flow untouched).
 */

/**
 * Idempotency strategy:
 *
 * 1. Inbound webhooks: dedicated `mollie_webhook_events` ledger (provider + event id unique),
 *    mirroring fastspring_webhook_events. Always fetch authoritative object from Mollie API
 *    before mutating mollie_test_subscriptions.
 * 2. Outbound charge/subscription creation: deterministic idempotency key on POST.
 * 3. Payload hash mismatch on redelivery → fail closed (same pattern as FastSpring).
 */

export type MollieFoundationPhase = "phase_2_test_lifecycle";

export const MOLLIE_FOUNDATION_PHASE: MollieFoundationPhase = "phase_2_test_lifecycle";

/**
 * Phase 2 webhook contract:
 * - POST /api/mollie/webhook — extract payment id, idempotency ledger, fetch resource from API.
 * - Never trust webhook body alone for subscription state mutations.
 * - Parallel test state in mollie_test_subscriptions (never organization_subscriptions / entitlements).
 */
