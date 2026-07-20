# Enterprise Definition of Done

**Canonical** engineering DoD for Auroranexis before Release Candidate promotion.  
**Related:** [enterprise-dod-report.md](./enterprise-dod-report.md) · [enterprise-release-checklist.md](./enterprise-release-checklist.md) · [technical-debt.md](./technical-debt.md)

Operators still complete the release checklist for environment cutover. This document is the **engineering** gate.

---

## Global DoD criteria

For each shipped module:

- [x] Functional completeness for shipped scope
- [x] Stable architecture (Build Bible Ch1–16)
- [x] No placeholder module shells in product UI
- [x] No `TODO` / `FIXME` / `HACK` in `src/`
- [x] No unfinished primary workflows (create → manage → archive/portal where applicable)
- [x] No hidden production feature flags that bypass entitlements (`DEV_FORCE_PLAN` ignored in production)
- [x] No debug `console.log` in `src/`
- [x] Production error boundaries on dashboard / marketing / portal / root
- [x] Validation on server actions / API inputs
- [x] Authorization via RBAC + RLS tenancy
- [x] Documentation synchronized (Paddle-only billing)

---

## Feature completeness matrix

| Module | DoD | Notes |
|--------|-----|-------|
| Authentication | Complete | Login, signup, reset, session; root error/loading/not-found |
| Organizations | Complete | Bootstrap on signup; org settings |
| Users / RBAC | Complete | Roles + module matrix + team settings |
| Clients | Complete | CRUD / archive / health |
| Health Engine | Complete | Snapshots + dashboard metrics |
| Reports | Complete | Create/edit/publish/templates/schedules; empty-client uses `EmptyState` |
| Risks | Complete | Lifecycle + portal visibility |
| Incidents | Complete | Lifecycle + portal visibility |
| Portal | Complete | Isolated client surfaces + legal |
| Billing / Subscriptions / Invoices | Complete with conditions | Paddle sole provider; Stripe archive named fields deferred |
| Analytics | Complete with conditions | Consent-gated; optional sinks |
| Dashboard | Complete | Command center + hubs |
| Settings | Complete | Org, team, billing, branding, SLA, API, diagnostics |
| Developer Tools / API | Complete with conditions | Plan-gated API keys/webhooks |
| Marketing Website | Complete | SEO/a11y chapters apply |
| AI Features | Complete with conditions | Graceful placeholder provider when unconfigured |
| Notifications | Complete | In-app notifications |
| Automation | Complete with conditions | Placeholder action types skipped intentionally |
| Knowledge | Complete with conditions | Keyword path live; vector stub deferred |
| Compliance / CS / Executive / Sales | Complete | Shipped modules present |

---

## Production readiness gates

- [x] API v1 `withApiHandler` + scopes (session `/me` excepted)
- [x] Server actions authorized
- [x] Migrations ordered; RLS documented
- [x] `/api/health`, `/api/ready`, error/not-found/loading shells
- [x] Cron bearer fail-closed outside development
- [x] Paddle webhook signature + idempotency

---

## Security readiness gates

- [x] Auth + RBAC + org isolation
- [x] Secrets not on `NEXT_PUBLIC_` (except intentional public tokens)
- [x] Paddle webhook verification
- [x] Turnstile / rate-limit E2E bypasses forbidden in production docs
- [x] No `/api/stripe` active routes

---

## Engineering standards compliance

| Chapter | Gate |
|---------|------|
| 1 Foundation | Implemented |
| 2 Architecture | Implemented |
| 3 Next/TS | Implemented |
| 4 Design system | Implemented |
| 5 Database | Implemented |
| 6 API | Implemented |
| 7 Performance | Implemented |
| 8 SEO | Implemented |
| 9 i18n | Implemented |
| 10 Accessibility | Implemented |
| 11 Analytics | Implemented |
| 12 Paddle Billing | Implemented |
| 13 Regression | Implemented |
| 14 Production readiness | Implemented |
| 15 Code quality | Implemented |
| 16 Technical debt | Implemented |
| 17 Definition of Done | Implemented |

---

## Test gates (must pass)

```bash
npm run lint
npm run typecheck
npm run build
npm run test:definition-of-done
npm run test:enterprise-regression
npm run test:paddle-billing
```

Domain suites covered by enterprise regression: SEO, analytics, i18n/currency, a11y (ch10), AI safety, OpenAI contracts.

---

## Accepted conditions (not NO GO)

Documented in [technical-debt.md](./technical-debt.md):

1. Gradual typed Supabase write migration (`as never` density)
2. Stripe-named archive/diagnostics fields until purge policy
3. AI/automation/knowledge graceful stubs when providers unconfigured
4. Operator release checklist sign-off still required for live cutover
