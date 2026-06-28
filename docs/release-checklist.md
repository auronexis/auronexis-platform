# Release Checklist — Auroranexis v0.9 RC

**Target:** Pilot customer ready · Enterprise demo ready · Production deployment ready

Use this checklist before promoting any environment to pilot or production.

---

## Supabase

- [ ] All 30 migrations applied (`supabase db push` / dashboard migration history)
- [ ] RLS enabled on all public tables (verify via security audit)
- [ ] Service role key stored in deployment secrets (never client-side)
- [ ] Anon key configured in `NEXT_PUBLIC_SUPABASE_*`
- [ ] Connection pooling enabled for serverless (Supabase pooler URL)
- [ ] Database backups scheduled (daily minimum)
- [ ] Point-in-time recovery tested on staging

---

## Stripe

- [ ] Live/test keys separated per environment
- [ ] Price IDs configured: starter, professional, business, enterprise
- [ ] Webhook endpoint registered with signing secret
- [ ] Customer portal enabled
- [ ] Test checkout + subscription lifecycle on staging
- [ ] Webhook idempotency reviewed (see security audit)

---

## AI providers

- [ ] `OPENAI_API_KEY` set (or configured provider)
- [ ] `OPENAI_MODEL` set appropriately
- [ ] `AI_PROVIDER` env matches deployment intent
- [ ] Usage limits align with plan enforcement
- [ ] Anthropic key (if used) stored securely

---

## SMTP / email

- [ ] Resend API key or SMTP credentials configured
- [ ] Sender domain verified (SPF/DKIM)
- [ ] Report email delivery tested end-to-end
- [ ] Org email settings page validated

---

## OAuth

- [ ] Connector OAuth client IDs/secrets per provider
- [ ] Redirect URIs match deployment URL
- [ ] OAuth state table reachable
- [ ] Test connect/disconnect on staging

---

## Storage

- [ ] `white-label-assets` bucket exists
- [ ] Storage policies applied (org folder isolation)
- [ ] Asset upload size limits acceptable (2 MB)

---

## Secrets

- [ ] `INTEGRATION_SECRET_KEY` set (64-char hex recommended)
- [ ] Key rotation procedure documented
- [ ] No secrets in git or client bundles

---

## Webhooks

- [ ] Stripe webhook URL live and verified
- [ ] Outbound API webhook signing secret configured per endpoint
- [ ] Dead letter / retry monitoring for integration deliveries

---

## Cron jobs

- [ ] Report schedule runner configured (external cron required)
- [ ] SLA/escalation evaluation scheduled (not only dashboard-triggered)
- [ ] Connector scheduled sync jobs configured
- [ ] Usage snapshot / billing meter jobs if applicable

---

## Monitoring

- [ ] Error tracking (Sentry or equivalent) wired to production
- [ ] Uptime monitoring on `/` and auth routes
- [ ] Supabase dashboard alerts enabled
- [ ] Stripe dashboard alerts enabled

---

## Diagnostics

- [ ] Settings → Diagnostics all sections green or explained:
  - Organization, Plan, Subscription, Stripe prices
  - AI readiness + AI diagnostics
  - Permissions, Automation persistence + engine
  - Integrations + Integration Runtime
  - Predictive Intelligence
  - Enterprise Connectors
  - Public API
  - White Label
  - Billing platform
  - Compliance platform
  - Integration secrets
  - Platform health

---

## Billing

- [ ] Plan feature matrix matches product marketing
- [ ] Seat limits enforced
- [ ] Usage metering recording events
- [ ] Invoice generation tested

---

## API

- [ ] Public API plan feature enabled for target tier
- [ ] Rate limits acceptable for pilot load
- [ ] OpenAPI documentation published
- [ ] API key create/revoke tested

---

## Compliance

- [ ] Audit events recording on sensitive actions
- [ ] GDPR request workflow tested
- [ ] Audit export downloadable
- [ ] Retention rules reviewed (simulation-only default)

---

## Backups & recovery

- [ ] Supabase backup retention configured
- [ ] Recovery runbook documented
- [ ] RTO/RPO agreed for pilot

---

## Incident process

- [ ] On-call contact defined
- [ ] Severity levels documented
- [ ] Escalation path to engineering

---

## Support & legal

- [ ] Support email published (`support@…`)
- [ ] Privacy policy URL live
- [ ] Terms of service URL live
- [ ] Cookie notice on marketing/auth surfaces (if applicable)

---

## Pre-release validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e          # requires E2E_EMAIL / E2E_PASSWORD
```

---

## Sign-off

| Role | Name | Date | Environment |
|------|------|------|-------------|
| Engineering | | | |
| QA | | | |
| Product | | | |

## Related

- [deployment.md](./deployment.md)
- [testing.md](./testing.md)
- [launch-readiness-report.md](./launch-readiness-report.md)
