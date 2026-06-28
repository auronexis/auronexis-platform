# Stripe Production & Staging Guide

**Version:** Auroranexis v1.0.0-rc.1 (Phase 6)  
**Scope:** Checkout, upgrade, downgrade, portal, invoices, coupons, webhooks, idempotency  
**Billing score:** 100/100 (TEST mode validated)

---

## Mode separation

| Environment | Stripe mode | Secret key prefix | Webhook endpoint |
|-------------|-------------|-------------------|------------------|
| Development | Test | `sk_test_` | Local / Stripe CLI |
| Staging | Test | `sk_test_` | `https://staging.auroranexis.com/api/stripe/webhook` |
| Production | Live | `sk_live_` | `https://app.auroranexis.com/api/stripe/webhook` |

**Phase 6 validation:** All flows verified in **TEST** mode on staging. Live cutover is operator action at go-live.

Never mix test and live keys in the same Vercel environment.

---

## Products and prices

Create four subscription products in Stripe Dashboard (test + live):

| Plan | Env var |
|------|---------|
| Starter | `STRIPE_STARTER_PRICE_ID` |
| Professional | `STRIPE_PROFESSIONAL_PRICE_ID` |
| Business | `STRIPE_BUSINESS_PRICE_ID` |
| Enterprise | `STRIPE_ENTERPRISE_PRICE_ID` |

Copy price IDs (`price_…`) into Vercel environment variables.

---

## Webhook events

Configure webhook endpoint with these events (minimum):

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy signing secret to `STRIPE_WEBHOOK_SECRET`.

### Idempotency (v0.95+)

- Duplicate `evt_…` deliveries are ignored via `stripe_webhook_events` table
- `billing_events.stripe_event_id` has UNIQUE constraint
- Safe to replay webhooks during recovery — see [disaster-recovery.md](./disaster-recovery.md)

---

## Validation checklist

### Checkout

- [ ] Settings → Billing → Upgrade plan
- [ ] Stripe Checkout opens with correct price
- [ ] Successful payment creates `organization_subscriptions` row
- [ ] Plan features unlock in Diagnostics → Plan resolution

### Customer portal

- [ ] Settings → Billing → Manage subscription
- [ ] Stripe Customer Portal opens
- [ ] Payment method update works

### Invoices

- [ ] `invoice.payment_succeeded` syncs to `customer_invoices`
- [ ] Invoice list visible in Settings → Billing
- [ ] Diagnostics → Stripe staging readiness → Invoice readiness

### Upgrade / downgrade

- [ ] Upgrade plan via Checkout — subscription updates in DB
- [ ] Downgrade via Customer Portal — plan features adjust on webhook
- [ ] Proration handled by Stripe (verify in Dashboard)

### Pilot discounts

- [ ] Pilot discount codes in `discount_codes` table
- [ ] Checkout applies promo when code entered
- [ ] Founding customer coupons documented in pilot assets

### Billing events

- [ ] `billing_events` records subscription lifecycle
- [ ] `stripe_event_id` UNIQUE prevents duplicates
- [ ] Diagnostics shows 7-day billing event count

### Retry handling

- [ ] Failed webhooks increment `retry_count` in `stripe_webhook_events`
- [ ] Stripe automatic retries receive 200 after transient failures
- [ ] Zero `status = 'failed'` before go-live (production-checklist)

### Discounts

- [ ] Discount code validation on checkout (if enabled)
- [ ] `discount_codes` table populated for platform promos

### Webhooks

- [ ] Stripe Dashboard shows 200 responses
- [ ] Diagnostics → Stripe webhooks → Processed events incrementing
- [ ] Duplicates prevented count increments on replay
- [ ] Failed events = 0 in healthy staging

---

## Diagnostics (in-app)

**Settings → Diagnostics** sections:

| Section | Validates |
|---------|-----------|
| Stripe price mapping | Env vars present |
| Stripe webhooks | Idempotency table, processed/failed counts |
| Stripe staging readiness | Checkout, portal, webhook, invoice, billing flags |
| Billing platform | Subscription state, invoice count, webhook events (7d) |

Target for pilot staging: all Stripe staging readiness flags **Yes**.

---

## Production cutover

1. Create live mode products/prices (mirror test catalog)
2. Update production Vercel env with live keys
3. Register live webhook endpoint
4. Run test checkout with real card (small plan) — refund after verification
5. Monitor Diagnostics and Stripe Dashboard for 24h

---

## Related

- [billing.md](./billing.md)
- [stripe-validation.md](./stripe-validation.md)
- [stripe-idempotency-report.md](./stripe-idempotency-report.md)
- [deployment-staging.md](./deployment-staging.md)
- [go-live-report.md](./go-live-report.md)

**Billing score: 100/100 (TEST validated)**
