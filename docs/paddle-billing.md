# Paddle Billing Integration

Production-safe dual-provider billing. Stripe remains fully intact.

## Status

- Stripe: production history preserved
- Paddle: sandbox-ready when `BILLING_PROVIDER=paddle` and price IDs are configured
- Production Paddle cutover requires explicit owner approval (do not automate)

## Environment variables (names only)

| Name | Scope | Notes |
|------|-------|-------|
| `BILLING_PROVIDER` | server | `stripe` (default) or `paddle` |
| `PADDLE_API_KEY` | server-only | Never expose to browser |
| `PADDLE_WEBHOOK_SECRET` | server-only | Signature verification |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | browser-safe | Paddle.js token |
| `PADDLE_ENVIRONMENT` | server | Exactly `sandbox` or `production` |
| `PADDLE_PRICE_PROFESSIONAL_MONTHLY` | server | `pri_…` from Paddle |
| `PADDLE_PRICE_BUSINESS_MONTHLY` | server | `pri_…` from Paddle |
| `PADDLE_PRICE_ENTERPRISE_MONTHLY` | server | optional; Enterprise remains quotation-first |

## Apply database migration (owner)

If `20250717000000_paddle_billing.sql` has not been applied yet:

1. Open Supabase Dashboard → SQL Editor for the production project.
2. Paste the full contents of `supabase/migrations/20250717000000_paddle_billing.sql`.
3. Run the script once.
4. Confirm these objects exist:
   - columns on `organization_subscriptions`: `billing_provider`, `provider_customer_id`, `provider_subscription_id`, `provider_price_id`, `provider_status`, `sync_pending`
   - table `paddle_webhook_events`
   - table `billing_provider_transactions`
5. Do not drop Stripe columns or `customer_invoices`.

Optional CLI: `supabase db push` (only if your CLI is pointed at the correct project).

## Sandbox activation checklist

1. Confirm Vercel has all `PADDLE_*` price IDs and secrets (already done if this report says so).
2. Set `BILLING_PROVIDER=paddle` in Vercel if not already set (defaults to `stripe`).
3. Keep `PADDLE_ENVIRONMENT=sandbox`.
4. Redeploy after any env change.
5. Confirm webhook destination: `https://auroranexis.com/api/paddle/webhook`

## Legal review TODO

- [ ] Qualified German/EU counsel must review `/terms` (including Paddle MoR section) and `/refund-policy` before any compliance claim.
- Existing German liability, governing law, and jurisdiction clauses were retained deliberately.

## Checkout location

- Public pricing: `/pricing` (plan CTAs lead to signup / workspace plans)
- Authenticated checkout: `/settings/plans` opens Paddle.js overlay when provider is paddle
- Access is never granted from browser success alone — webhook/server reconciliation required

## Legal pages

- Terms: `/terms` (extended with Paddle Merchant of Record section; German liability/governing law retained)
- Refund policy: `/refund-policy` (public, footer + sitemap)
- **Legal review required** by qualified German/EU counsel before relying on these texts for compliance claims

## Rollback

1. Set `BILLING_PROVIDER=stripe` and redeploy
2. Optionally drop additive tables/columns per rollback notes in the migration
3. Stripe columns, invoices, and webhook history remain untouched

## Production cutover checklist (owner-only)

- [ ] Paddle live approval
- [ ] Production API key, client token, webhook secret
- [ ] Production price IDs
- [ ] Approved checkout domain
- [ ] `PADDLE_ENVIRONMENT=production`
- [ ] Verified live webhook delivery
- [ ] Legal pages live and counsel-reviewed
- [ ] Controlled real purchase test
- [ ] Stripe remains available until Paddle is proven
