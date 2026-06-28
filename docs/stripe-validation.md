# Stripe Validation Report

**Date:** 2025-06-23  
**Version:** v0.99.0  
**Mode:** Test keys on staging; live keys on production only after sign-off

**Webhook endpoint (staging):** `https://staging.auroranexis.com/api/stripe/webhook`

---

## Pre-flight

| Variable | Staging | Production |
|----------|---------|------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | From staging endpoint | From production endpoint |
| Price IDs | Test mode prices | Live mode prices |

Diagnostics → **Stripe staging readiness** should show all green before pilot billing tests.

---

## Test matrix

| Flow | Test procedure | Event | Status |
|------|----------------|-------|--------|
| Checkout | Settings → Billing → Upgrade → card `4242…` | `checkout.session.completed` | Pending operator |
| Billing Portal | Manage subscription link | Portal session | Pending operator |
| Invoices | Complete checkout → view invoice list | `invoice.paid` | Pending operator |
| Discounts | Create `PILOT50` coupon in Dashboard | `invoice.paid` (discounted) | Pending operator |
| Coupons | Apply at checkout | Discount on session | Pending operator |
| Webhook delivery | Stripe Dashboard → Webhooks → Send test | 200 response | Pending operator |
| Webhook idempotency | Replay same event ID | Single DB row | Verified in code |
| Customer creation | First checkout | `customer.created` | Pending operator |
| Subscription upgrade | Portal → higher plan | `customer.subscription.updated` | Pending operator |
| Subscription downgrade | Portal → lower plan | `customer.subscription.updated` | Pending operator |
| Cancellation | Portal → cancel at period end | `customer.subscription.deleted` | Pending operator |
| Invoice sync | Webhook → Supabase `customer_invoices` | Row match | Pending operator |
| Diagnostic events | Settings → Diagnostics → Stripe section | Counts update | Pending operator |

---

## Webhook idempotency

Implemented via `stripe_webhook_events` table:

- Duplicate `event.id` → skipped (no double processing)
- Failed events → visible in diagnostics with count
- See [stripe-idempotency-report.md](./stripe-idempotency-report.md)

---

## Staging smoke test (15 min)

1. Login to staging workspace
2. Upgrade to Professional (test card)
3. Confirm subscription active in Settings → Billing
4. Open Customer Portal → verify plan
5. Stripe Dashboard → Webhooks → verify 200 responses
6. Diagnostics → failed webhooks = 0

---

## Production cutover

- [ ] Swap to live Stripe keys in production Vercel env
- [ ] Register production webhook URL
- [ ] Verify live price IDs
- [ ] Run single real transaction with founder account before pilot billing

See [stripe-production.md](./stripe-production.md).

---

## Related

- [stripe-staging-validation.md](./stripe-staging-validation.md)
- [billing.md](./billing.md)
- [pricing-assumptions.md](./pricing-assumptions.md)
