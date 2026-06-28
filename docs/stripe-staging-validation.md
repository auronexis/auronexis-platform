# Stripe Staging Validation

**Version:** Auroranexis v0.97  
**Mode:** Test keys only (`sk_test_`, `pk_test_`)  
**Webhook:** `https://staging.auroranexis.com/api/stripe/webhook`

---

## Pre-flight

- [ ] `STRIPE_SECRET_KEY` = test mode
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = test mode
- [ ] `STRIPE_WEBHOOK_SECRET` matches staging webhook endpoint
- [ ] Price IDs set: `STRIPE_STARTER_PRICE_ID` through `STRIPE_ENTERPRISE_PRICE_ID`
- [ ] Diagnostics → **Stripe staging readiness** all green

---

## Checkout

1. Login to staging → Settings → Billing → Upgrade
2. Select plan → Stripe Checkout opens
3. Card: `4242 4242 4242 4242`, any future expiry, any CVC
4. Complete payment
5. Verify: subscription active, plan features unlocked

**Event:** `checkout.session.completed`

---

## Customer Portal

1. Settings → Billing → Manage subscription
2. Portal opens (Stripe hosted)
3. Verify: plan name, payment method, invoice history

---

## Invoices

- [ ] Invoice list visible in Billing settings
- [ ] `customer_invoices` row created in Supabase
- [ ] PDF / hosted invoice links work (Stripe test)

**Event:** `invoice.paid`

---

## Coupons & discounts

1. Stripe Dashboard → Coupons → create `PILOT50` (50% off, 2 months)
2. Apply at checkout or via Portal
3. Verify discounted amount on invoice

See [pricing-beta.md](./pricing-beta.md).

---

## Subscription upgrades / downgrades

1. Portal → Update plan (or app checkout for higher tier)
2. Verify proration in Stripe Dashboard
3. App plan features update after webhook

**Event:** `subscription.updated`

---

## Webhook idempotency

1. Stripe Dashboard → Webhooks → Send test event
2. Send **same event ID twice**
3. Verify:
   - First: `200`, processed
   - Second: `200`, `duplicate: true` in logs
   - Single row in `stripe_webhook_events`
   - Single billing side-effect in `billing_events`

**Report:** [stripe-idempotency-report.md](./stripe-idempotency-report.md)

---

## Test events matrix

| Event | Trigger | Verify |
|-------|---------|--------|
| `checkout.session.completed` | New subscription checkout | Plan active, usage snapshot |
| `invoice.paid` | Successful payment | Invoice row, paid status |
| `invoice.payment_failed` | Test fail card `4000 0000 0000 0341` | Billing alert, grace state |
| `subscription.updated` | Plan change in Portal | Plan key updated |
| `customer.updated` | Email change in Portal | Customer metadata synced |

---

## Failure testing

```bash
# Replay webhook with Stripe CLI (optional)
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

---

## Related

- [stripe-production.md](./stripe-production.md)
- [billing.md](./billing.md)
- [stripe-idempotency-report.md](./stripe-idempotency-report.md)
