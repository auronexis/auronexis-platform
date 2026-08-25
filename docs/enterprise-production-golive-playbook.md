# Enterprise Production Go-Live Playbook — Build Bible V2 Chapter 20

**Role:** Enterprise Release Manager
**Date:** 2026-08-25 (Mollie-era synchronization)
**Product:** Auroranexis
**CURRENT BILLING PROVIDER:** Mollie (sole active)
**Production mode:** **SAFE CONTROLLED PRODUCTION MODE** — `MOLLIE_LIVE_CHARGING_ENABLED=false`, `MOLLIE_BILLING_ROLLOUT=true`, operator/test org allowlisted
**Inputs:** Chapter 19 **APPROVED WITH CONDITIONS**; Chapters 17–18 DoD + Certification; verified closeout baselines in `docs/final-production-closeout.md`
**Constraints:** No business-logic changes · No automatic commit / push / deploy · Do not enable Mollie LIVE charging from this playbook · Do not treat Stripe/Paddle/FastSpring as active

---

## Executive Summary

Engineering Build Bible V2 (Chapters 1–20) is complete and gate-validated. Chapter 19 authorized production **with conditions**. This playbook is the operator runbook for controlled production operations under **Mollie**.

**Verified engineering baseline (2026-08-25):** P1-001 CLOSED; P1-003 CLOSED; P1-005 eng CLOSED; P1-006 CLOSED; white-label `production_ok=true`; Supabase `20250824140000` grants applied; Vercel has `SENTRY_DSN`, `INTEGRATION_SECRET_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`; PostHog `$pageview` LIVE with consent gating. **P1-002 remains OPEN** (external legal/tax/MoR) — do **not** claim legally approved for unrestricted live commercial charging.

# Recommendation: READY FOR OPERATOR DEPLOYMENT

Operators may run this playbook for **controlled production** (TEST Mollie keys / LIVE charging off). Items marked **INCOMPLETE** below are operator-owned. Nothing in this document auto-commits, pushes, or deploys. **Do not promote unrestricted LIVE revenue** until P1-002 is cleared by counsel.

---

## Phase 1 — Chapter 19 Release Conditions

Status legend: **COMPLETE** (verified by engineering / operator closeout) · **INCOMPLETE** (operator must confirm) · **BLOCKED** (hard stop)

| # | Condition | Status | Notes |
|---|-----------|--------|-------|
| 1 | Enterprise release checklist A–O with owners/timestamps | **INCOMPLETE** | Template: [enterprise-release-checklist.md](./enterprise-release-checklist.md) |
| 2 | Production secrets; bypass flags unset; Mollie controlled mode | **INCOMPLETE** | Confirm `MOLLIE_LIVE_CHARGING_ENABLED=false`; `MOLLIE_BILLING_ROLLOUT=true`; allowlist as needed |
| 3 | Staging migrations OK; prod migration + PITR plan | **INCOMPLETE** | Apply on staging first; confirm Supabase backup |
| 4 | Staging Mollie webhook / TEST checkout smoke | **INCOMPLETE** | Operator staging smoke — no LIVE charges |
| 5 | Staging auth + portal isolation smoke | **INCOMPLETE** | Operator staging smoke |
| 6 | Health/ready monitored; error reporting on target | **COMPLETE** (ops) / **INCOMPLETE** (named on-call) | Sentry + PostHog configured in Vercel |
| 7 | Prior Vercel deployment ID; rollback owners; webhook rotate known | **INCOMPLETE** | Record IDs before promote |
| 8 | Engineering / Product / On-call sign-off | **INCOMPLETE** | Checklist sign-off table |
| 9 | Deferred typed-write / Stripe archive accepted as V2 | **COMPLETE** | Catalogued; not a go-live blocker |
| 10 | No auto commit/push/deploy from Ch19/Ch20 | **COMPLETE** | Honored |
| 11 | P1-002 external legal/tax/MoR review | **INCOMPLETE** | **OPEN** — blocks unrestricted LIVE revenue only |

### Supporting production surfaces

| Surface | Status | Notes |
|---------|--------|-------|
| Production secrets (documented contract) | **COMPLETE** (docs + verified keys) | `.env.example` + production-audit; Sentry/PostHog/INTEGRATION_SECRET_KEY set |
| Mollie controlled configuration | **COMPLETE** (verified mode) | LIVE charging **false**; rollout **true**; allowlist for operator/test orgs |
| Supabase project readiness | **COMPLETE** (grants + white-label) | `20250824140000` applied; white-label `production_ok=true` |
| Vercel project readiness | **COMPLETE** (env) / **INCOMPLETE** (promote ritual) | Production env verified for observability + vault |
| DNS / SSL | **INCOMPLETE** | Confirm www / app / apex per enterprise-deployment |
| Webhook `/api/mollie/webhook` | **INCOMPLETE** (dashboard confirm) | Classic payment webhook only — not Next-Gen |
| Environment variables | **INCOMPLETE** (diff ritual) | Diff against `.env.example`; remove legacy provider keys |
| Backup strategy | **COMPLETE** (docs) / **INCOMPLETE** (owner assigned) | [disaster-recovery.md](./disaster-recovery.md) |
| Rollback strategy | **COMPLETE** (docs) / **INCOMPLETE** (owners + prior deploy ID) | [rollback-plan.md](./rollback-plan.md) |
| Monitoring / Logging / Error reporting | **COMPLETE** (verified) | `/api/health`, `/api/ready`, Sentry, PostHog consent-gated |
| Support readiness | **COMPLETE** (docs) / **INCOMPLETE** (named on-call) | Runbooks present |

**BLOCKED items:** none at engineering layer for controlled production. Unrestricted LIVE charging remains **blocked by P1-002** (external).

---

## Phase 2 — Final Operational Checklist

Operators mark each row during go-live. Pre-flight engineering status shown.

| Area | Pre-flight | Operator action |
|------|------------|-----------------|
| Environment | Docs + contracts COMPLETE | Diff Production secrets; unset bypass flags |
| Domains | Documented COMPLETE | Verify www / redirects exclude `/api` |
| Health endpoints | Code COMPLETE | `GET /api/health`, `GET /api/ready` after deploy |
| Cron / background jobs | `vercel.json` `*/5` COMPLETE | Confirm `CRON_SECRET` + cron invocations |
| Storage | Platform COMPLETE | Confirm Supabase storage if used |
| Emails | Provider-config INCOMPLETE | Verify SMTP path + send test |
| Authentication | Code COMPLETE | Login / logout / reset smoke |
| Portal | Code COMPLETE | Portal login + isolation |
| Developer APIs | Code COMPLETE | Key create / scoped call (plan-gated) |
| Billing / Subscriptions / Invoices | Mollie path COMPLETE | TEST checkout only while LIVE=false |
| Reports / Analytics | Code COMPLETE | Spot-check; consent gates (PostHog verified) |
| Monitoring / Incident procedures | Docs COMPLETE | On-call + status process |
| Rollback / Disaster recovery | Docs COMPLETE | Owners + PITR confirmed |

Canonical detailed boxes: [enterprise-release-checklist.md](./enterprise-release-checklist.md).

---

## Phase 3 — Prepare Git Release (DO NOT EXECUTE HERE)

| Item | Recommendation |
|------|----------------|
| **Release version** | `1.1.0` (Enterprise Build Bible V2 go-live; bump `package.json` in the release commit) |
| **Git tag** | `v1.1.0` |
| **Rollback tag** | Tag current production artifact before promote as `v1.0.3-prod` (or last known good SHA); retain prior Vercel deployment ID |
| **Release branch** | `release/1.1.0` |
| **Merge strategy** | Squash or merge PR `release/1.1.0` → `main`; protect `main`; tag `v1.1.0` on merge commit; push tags |
| **Commit message** | `release: Auroranexis 1.1.0 enterprise Build Bible V2 go-live` |
| **Release notes (summary)** | Build Bible V2 Ch1–20 complete; Mollie-only billing (SAFE CONTROLLED PRODUCTION MODE); enterprise regression + certification; DoD GO WITH CONDITIONS; Certification CERTIFIED WITH OBSERVATIONS; Release APPROVED WITH CONDITIONS; P1-002 open for LIVE revenue |

### Operator git sequence (manual — not run by Cursor)

```text
1. Review full diff; exclude secrets (.env*, credentials)
2. Create branch release/1.1.0
3. Bump package.json version to 1.1.0
4. Commit with recommended message
5. Push branch; open PR; wait for CI green
6. Merge to main
7. Tag v1.1.0; push tag
8. Record previous production deploy ID for rollback
```

**Status:** Git packaging **INCOMPLETE** until operators execute the sequence. **Do not promote** a dirty or untagged tree from Cursor automation.

---

## Phase 4 — Prepare Deployment (DO NOT DEPLOY HERE)

Canonical narrative: [enterprise-deployment.md](./enterprise-deployment.md). Exact operator order:

### 4.1 Git / GitHub

1. Complete Phase 3 packaging.
2. Confirm CI green on release commit (lint, typecheck, production-readiness, DoD, certification, release-approval, golive, enterprise-regression, build).
3. Do not promote a dirty or untagged tree.

### 4.2 Environment variables (Vercel Production)

1. Diff Production env vs `.env.example`.
2. Set Supabase, `NEXT_PUBLIC_APP_URL` HTTPS, `CRON_SECRET`, SMTP email, Mollie:
   - `MOLLIE_API_KEY` (`test_` for controlled mode; `live_` only with explicit LIVE approval)
   - `MOLLIE_BILLING_ROLLOUT=true`
   - `MOLLIE_LIVE_CHARGING_ENABLED=false` (required for SAFE CONTROLLED PRODUCTION MODE)
   - Optional `MOLLIE_BILLING_ORG_ALLOWLIST` (comma-separated org UUIDs)
3. Confirm observability: `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY` (EU host recommended).
4. Confirm `INTEGRATION_SECRET_KEY` for vault writes.
5. Ensure `TURNSTILE_DISABLE`, `E2E_DISABLE_RATE_LIMIT`, `DEV_FORCE_PLAN` are **unset**.
6. Remove unused legacy FastSpring/Paddle/Stripe keys (see [legacy-billing-provider-removal-final.md](./legacy-billing-provider-removal-final.md)).

### 4.3 Supabase

1. Confirm PITR / backup.
2. Apply pending migrations in timestamp order on **staging**, then **production** (including white-label + `20250824140000_public_api_service_role_grants.sql` if not already applied).
3. Forward-only; restore path = [rollback-plan.md](./rollback-plan.md) §2.

### 4.4 Mollie

1. Register classic webhook: `https://www.auroranexis.com/api/mollie/webhook` (or production app host).
2. Do **not** configure Next-Gen Dashboard webhooks / `X-Mollie-Signature` for this integration (code expects classic payment id + API re-fetch).
3. Keep LIVE charging disabled until P1-002 + explicit LIVE approval.
4. `/api/fastspring/*` returns **410 Gone** — do not register FastSpring webhooks.

### 4.5 Vercel

1. Deploy Production from `v1.1.0` / `main` release commit.
2. Confirm cron `GET /api/cron/run` every 5 minutes with bearer secret (`CRON_SECRET` must be set in Production).
3. Confirm apex→www redirects **exclude** `/api`.

### 4.6 Cache / CDN

1. Allow Vercel deploy to invalidate edge cache.
2. Hard-refresh critical marketing + billing pages post-deploy.

### 4.7 Post-deployment verification (order)

1. `/api/ready` → 200
2. `/api/health` not unavailable; billing flag reflects Mollie (`configuration.mollie`)
3. Homepage + login
4. Dashboard smoke
5. Portal smoke
6. Billing settings (TEST checkout only; no LIVE charge)
7. Cron invocation log
8. Sentry event (optional test) + PostHog consent-gated `$pageview`

---

## Phase 5 — Production Smoke-Test Checklist

Operators check each after promote (or on staging first).

| # | Surface | Pass? |
|---|---------|-------|
| 1 | Homepage | ☐ |
| 2 | Authentication (login/logout) | ☐ |
| 3 | Registration | ☐ |
| 4 | Password reset | ☐ |
| 5 | Dashboard | ☐ |
| 6 | Client portal | ☐ |
| 7 | Clients | ☐ |
| 8 | Reports | ☐ |
| 9 | Health | ☐ |
| 10 | Risks | ☐ |
| 11 | Billing settings | ☐ |
| 12 | Checkout (Mollie TEST / controlled only) | ☐ |
| 13 | Upgrade | ☐ |
| 14 | Downgrade | ☐ |
| 15 | Cancellation / withdrawal path | ☐ |
| 16 | Invoices / transaction history | ☐ |
| 17 | Notifications | ☐ |
| 18 | Global search | ☐ |
| 19 | Analytics (consent-gated; no PII) | ☐ |
| 20 | Developer APIs | ☐ |
| 21 | Settings | ☐ |
| 22 | Marketing pages | ☐ |
| 23 | Legal pages (privacy, terms, refund) | ☐ |
| 24 | SEO (`robots` / sitemap private exclusions) | ☐ |
| 25 | Accessibility spot-check (skip link, login keyboard) | ☐ |
| 26 | Internationalization (org currency/locale) | ☐ |
| 27 | Performance (dashboard under normal load) | ☐ |

---

## Phase 6 — Rollback Preparation

| Item | Status | Action |
|------|--------|--------|
| Rollback documentation | **COMPLETE** | [rollback-plan.md](./rollback-plan.md) |
| Rollback owners | **INCOMPLETE** | Name on-call before promote |
| Rollback commands | **COMPLETE** (docs) | Vercel Instant Rollback; env revert; pause Mollie webhook |
| Rollback timing | **COMPLETE** (guidance) | Prefer immediate app rollback on 5xx / bad build |
| Rollback criteria | **COMPLETE** | Ready probe fail, auth outage, billing storm, bad migration |
| Database compatibility | **COMPLETE** (forward-only policy) | Prefer app rollback; PITR if schema corrupt |
| Backup verification | **INCOMPLETE** | Confirm Supabase backup/PITR before migrate |
| Recovery procedure | **COMPLETE** (docs) | [disaster-recovery.md](./disaster-recovery.md) |

### Recommended rollback procedure (summary)

1. **App fault:** Instant Rollback to prior Vercel deployment → verify `/api/ready` → auth smoke.
2. **Bad env:** Revert secrets → redeploy/restart → re-audit env.
3. **Webhook storm:** Pause Mollie webhook destination → fix → re-enable; keep `MOLLIE_LIVE_CHARGING_ENABLED=false`.
4. **Bad migration:** Freeze writes → PITR/restore → re-apply known-good migrations only.

---

## Phase 7 — Executive Release Report

### Release status

| Domain | Status |
|--------|--------|
| Engineering | **COMPLETE** (Ch1–20 Implemented; gates green) |
| Operational | **READY with INCOMPLETE operator items** |
| Commercial | **SAFE CONTROLLED PRODUCTION MODE** (Mollie sole; LIVE off; P1-002 open) |
| Security | **READY** (no critical findings; LIVE revenue gated) |
| Architecture | **READY** (Ch2 preserved) |
| Production readiness | **READY FOR OPERATOR DEPLOYMENT** (controlled mode) |
| Known risks | Medium — P1-002 legal/tax; deferred typed-write debt |
| Deferred V2 | Typed writes, Stripe archive rename, auth shell parity |

### Recommended release window

Low-traffic weekday with named on-call. Start only after Phase 3 git packaging and checklist sections A–C complete.

### Recommended deployment order

1. Git package + CI green
2. Staging migrate + smoke (auth, portal, Mollie TEST)
3. Production secrets + Mollie classic webhook
4. Production migrate
5. Vercel Production promote
6. Phase 5 smoke
7. Checklist sign-off

### Recommended validation order

1. Ready/health
2. Auth
3. Dashboard + portal
4. Billing (non-destructive / TEST first)
5. Cron
6. SEO robots/sitemap spot-check
7. Monitoring alerts quiet for soak period

### Operator checklist pointer

Use [enterprise-release-checklist.md](./enterprise-release-checklist.md) as the binding sign-off artifact. This playbook is the narrative; the checklist is the checkbox record.

Canonical billing ops: [billing.md](./billing.md) · [enterprise-deployment.md](./enterprise-deployment.md).
Historical FastSpring/Paddle titles: [paddle-billing.md](./paddle-billing.md) (**HISTORICAL / SUPERSEDED**).

---

## Final Decision

# READY FOR OPERATOR DEPLOYMENT

**Justification:** Engineering and documentation gates for Build Bible V2 go-live are satisfied for **SAFE CONTROLLED PRODUCTION MODE**. Chapter 19 conditions that remain **INCOMPLETE** are operator execution items—not engineering blockers for controlled mode. No **BLOCKED** engineering items. **P1-002** remains the external gate for unrestricted LIVE commercial charging.

**Not automatic deployment:** Operators must still execute git packaging, clear INCOMPLETE rows, deploy, and smoke-test. Cursor / Chapter 20 must not commit, push, or deploy.

### If operators cannot start

Treat as **NOT READY** only when a new **BLOCKED** item appears (e.g. CI red on release commit, missing PITR with no backup owner, inability to obtain Mollie TEST credentials). At authoring time: **none** for controlled production.

---

## Release Manager attestation

Playbook synchronized to Mollie sole-provider reality under Chapter 20 constraints. No product business-logic changes required for this documentation pass. No push or LIVE charging enablement from this document.
