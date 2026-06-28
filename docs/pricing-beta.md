# Pilot Pricing (Beta)

**Version:** Auroranexis v0.96  
**Status:** Internal — not public marketing copy

---

## Standard plans (reference)

| Plan | Monthly (list) | Clients | Seats | Notes |
|------|----------------|---------|-------|-------|
| Starter | $99 | 5 | 3 | Core reporting |
| Professional | $249 | 15 | 10 | Automation + connectors |
| Business | $499 | 40 | 25 | Portal + compliance |
| Enterprise | Custom | Unlimited | Unlimited | White label, SLA |

Stripe price IDs are configured via `STRIPE_*_PRICE_ID` environment variables.

---

## Pilot offer (suggested)

| Item | Pilot terms |
|------|-------------|
| Duration | 6 weeks |
| Customers | Up to 3 agencies |
| Discount | **50% off** chosen plan for pilot period |
| Billing | Stripe subscription with coupon `PILOT50` (create in Stripe Dashboard) |
| Commitment | No long-term contract; convert to list price or cancel at end |
| Support | Direct Slack/email channel, weekly call |
| Feature scope | v0.96 feature set only — no custom development |

---

## Coupon setup (Stripe test / staging)

1. Stripe Dashboard → Products → Coupons → Create
2. Name: `Pilot 50% — 6 weeks`
3. Percent off: 50%
4. Duration: `repeating`, 2 months (covers 6-week pilot + buffer)
5. Apply at Checkout or Customer Portal subscription update

For production pilots, create equivalent live-mode coupon with approval.

---

## Conversion paths

**Convert to paid:** Remove coupon at period end or apply standard price via Portal.

**Extend pilot:** One-time 25% extension coupon (max 4 additional weeks).

**Churn:** Export data guide in [pilot-onboarding.md](./pilot-onboarding.md); honor GDPR export requests.

---

## Pricing conversations

Document in weekly feedback:

- Plan tier they would choose at list price
- Blockers to paying (missing connector, compliance cert, etc.)
- Competitive alternatives mentioned

---

## Related

- [billing.md](./billing.md)
- [stripe-production.md](./stripe-production.md)
- [pilot-program.md](./pilot-program.md)
