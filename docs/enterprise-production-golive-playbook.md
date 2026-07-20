# Enterprise Production Go-Live Playbook — Build Bible V2 Chapter 20

**Role:** Enterprise Release Manager  
**Date:** 2026-07-19  
**Product:** Auroranexis  
**Inputs:** Chapter 19 **APPROVED WITH CONDITIONS**; Chapters 17–18 DoD + Certification  
**Constraints:** No business-logic changes · No automatic commit / push / deploy · No git commands executed by this chapter

---

## Executive Summary

Engineering Build Bible V2 (Chapters 1–20) is complete and gate-validated. Chapter 19 authorized production **with conditions**. This playbook is the operator runbook to clear those conditions, package the release, deploy, smoke-test, and roll back if needed.

# Recommendation: READY FOR OPERATOR DEPLOYMENT

Operators may begin this playbook. Items marked **INCOMPLETE** below are operator-owned and must reach **COMPLETE** before production traffic promote. Nothing in this document auto-commits, pushes, or deploys.

---

## Phase 1 — Chapter 19 Release Conditions

Status legend: **COMPLETE** (verified by engineering gates / docs) · **INCOMPLETE** (operator must confirm on target env) · **BLOCKED** (hard stop)

| # | Condition | Status | Notes |
|---|-----------|--------|-------|
| 1 | Enterprise release checklist A–O with owners/timestamps | **INCOMPLETE** | Template: [enterprise-release-checklist.md](./enterprise-release-checklist.md) |
| 2 | Production secrets; bypass flags unset; Paddle live | **INCOMPLETE** | Operator verifies Vercel Production + Paddle dashboard |
| 3 | Staging migrations OK; prod migration + PITR plan | **INCOMPLETE** | Apply on staging first; confirm Supabase backup |
| 4 | Staging Paddle webhook / checkout / portal smoke | **INCOMPLETE** | Operator staging smoke |
| 5 | Staging auth + portal isolation smoke | **INCOMPLETE** | Operator staging smoke |
| 6 | Health/ready monitored; error reporting on target | **INCOMPLETE** | Wire monitors + Sentry project |
| 7 | Prior Vercel deployment ID; rollback owners; webhook rotate known | **INCOMPLETE** | Record IDs before promote |
| 8 | Engineering / Product / On-call sign-off | **INCOMPLETE** | Checklist sign-off table |
| 9 | Deferred typed-write / Stripe archive accepted as V2 | **COMPLETE** | Catalogued; not a go-live blocker |
| 10 | No auto commit/push/deploy from Ch19/Ch20 | **COMPLETE** | Honored |

### Supporting production surfaces

| Surface | Status | Notes |
|---------|--------|-------|
| Production secrets (documented contract) | **COMPLETE** (docs) / **INCOMPLETE** (live values) | `.env.example` + production-audit contracts |
| Paddle Live configuration | **INCOMPLETE** | Set `PADDLE_ENVIRONMENT=production` + live keys |
| Supabase project readiness | **INCOMPLETE** | Operator confirms project + migrations |
| Vercel project readiness | **INCOMPLETE** | Operator confirms Production env |
| DNS / SSL | **INCOMPLETE** | Confirm www / app / apex per enterprise-deployment |
| Webhook `/api/paddle/webhook` | **INCOMPLETE** | Register live URL in Paddle |
| Environment variables | **INCOMPLETE** | Diff against `.env.example` |
| Backup strategy | **COMPLETE** (docs) / **INCOMPLETE** (owner assigned) | [disaster-recovery.md](./disaster-recovery.md) |
| Rollback strategy | **COMPLETE** (docs) / **INCOMPLETE** (owners + prior deploy ID) | [rollback-plan.md](./rollback-plan.md) |
| Monitoring / Logging / Error reporting | **COMPLETE** (code) / **INCOMPLETE** (live wiring) | `/api/health`, `/api/ready`, Sentry |
| Support readiness | **COMPLETE** (docs) / **INCOMPLETE** (named on-call) | Runbooks present |

**BLOCKED items:** none at engineering layer.

---

## Phase 2 — Final Operational Checklist

Operators mark each row during go-live. Pre-flight engineering status shown.

| Area | Pre-flight | Operator action |
|------|------------|-----------------|
| Environment | Docs + contracts COMPLETE | Set Production secrets; unset bypass flags |
| Domains | Documented COMPLETE | Verify www / redirects exclude `/api` |
| Health endpoints | Code COMPLETE | `GET /api/health`, `GET /api/ready` after deploy |
| Cron / background jobs | `vercel.json` `*/5` COMPLETE | Confirm `CRON_SECRET` + cron invocations |
| Storage | Platform COMPLETE | Confirm Supabase storage if used |
| Emails | Provider-config INCOMPLETE | Verify domain + send test |
| Authentication | Code COMPLETE | Login / logout / reset smoke |
| Portal | Code COMPLETE | Portal login + isolation |
| Developer APIs | Code COMPLETE | Key create / scoped call (plan-gated) |
| Billing / Subscriptions / Invoices | Paddle path COMPLETE | Live checkout + history |
| Reports / Analytics | Code COMPLETE | Spot-check; consent gates |
| Monitoring / Incident procedures | Docs COMPLETE | On-call + status process |
| Rollback / Disaster recovery | Docs COMPLETE | Owners + PITR confirmed |

Canonical detailed boxes: [enterprise-release-checklist.md](./enterprise-release-checklist.md).

---

## Phase 3 — Prepare Git Release (DO NOT EXECUTE HERE)

Observed workspace state at playbook authoring: **large uncommitted Build Bible V2 + product tree on `main`**, package version **1.0.3**, last remote tip includes early foundation commit. Operators must package intentionally.

| Item | Recommendation |
|------|----------------|
| **Release version** | `1.1.0` (Enterprise Build Bible V2 go-live; bump `package.json` in the release commit) |
| **Git tag** | `v1.1.0` |
| **Rollback tag** | Tag current production artifact before promote as `v1.0.3-prod` (or last known good SHA); retain prior Vercel deployment ID |
| **Release branch** | `release/1.1.0` created from a clean review of the Build Bible V2 working tree |
| **Merge strategy** | Squash or merge PR `release/1.1.0` → `main`; protect `main`; tag `v1.1.0` on merge commit; push tags |
| **Commit message** | `release: Auroranexis 1.1.0 enterprise Build Bible V2 go-live` |
| **Release notes (summary)** | Build Bible V2 Ch1–20 complete; Paddle-only billing; enterprise regression + certification; DoD GO WITH CONDITIONS; Certification CERTIFIED WITH OBSERVATIONS; Release APPROVED WITH CONDITIONS; typed-write debt deferred to V2 |

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

**Status:** Git packaging **INCOMPLETE** until operators execute the sequence.

---

## Phase 4 — Prepare Deployment (DO NOT DEPLOY HERE)

Canonical narrative: [enterprise-deployment.md](./enterprise-deployment.md). Exact operator order:

### 4.1 Git / GitHub

1. Complete Phase 3 packaging.
2. Confirm CI green on release commit (lint, typecheck, production-readiness, DoD, certification, release-approval, golive, enterprise-regression, build).
3. Do not promote a dirty or untagged tree.

### 4.2 Environment variables (Vercel Production)

1. Diff Production env vs `.env.example`.
2. Set Supabase, Paddle live, `NEXT_PUBLIC_APP_URL` HTTPS, `CRON_SECRET`, email, Turnstile.
3. Ensure `TURNSTILE_DISABLE`, `E2E_DISABLE_RATE_LIMIT`, `DEV_FORCE_PLAN` are **unset**.
4. `PADDLE_ENVIRONMENT=production`.

### 4.3 Supabase

1. Confirm PITR / backup.
2. Apply pending migrations in timestamp order on **staging**, then **production**.
3. Forward-only; restore path = [rollback-plan.md](./rollback-plan.md) §2.

### 4.4 Paddle

1. Register webhook: `https://www.auroranexis.com/api/paddle/webhook` (or production app host).
2. Confirm live price IDs mapped.
3. Keep sandbox keys out of Production.

### 4.5 Vercel

1. Deploy Production from `v1.1.0` / `main` release commit.
2. Confirm cron `POST /api/cron/run` every 5 minutes with bearer secret.
3. Confirm apex→www redirects **exclude** `/api`.

### 4.6 Cache / CDN

1. Allow Vercel deploy to invalidate edge cache.
2. Hard-refresh critical marketing + billing pages post-deploy.

### 4.7 Post-deployment verification (order)

1. `/api/ready` → 200  
2. `/api/health` not unavailable; billing flag reflects Paddle  
3. Homepage + login  
4. Dashboard smoke  
5. Portal smoke  
6. Billing settings (no live charge unless intentional)  
7. Cron invocation log  
8. Sentry event (optional test)  

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
| 12 | Checkout (sandbox or controlled live) | ☐ |
| 13 | Upgrade | ☐ |
| 14 | Downgrade | ☐ |
| 15 | Cancellation / portal cancel path | ☐ |
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
| Rollback commands | **COMPLETE** (docs) | Vercel Instant Rollback; env revert; webhook disable |
| Rollback timing | **COMPLETE** (guidance) | Prefer immediate app rollback on 5xx / bad build |
| Rollback criteria | **COMPLETE** | Ready probe fail, auth outage, billing storm, bad migration |
| Database compatibility | **COMPLETE** (forward-only policy) | Prefer app rollback; PITR if schema corrupt |
| Backup verification | **INCOMPLETE** | Confirm Supabase backup/PITR before migrate |
| Recovery procedure | **COMPLETE** (docs) | [disaster-recovery.md](./disaster-recovery.md) |

### Recommended rollback procedure (summary)

1. **App fault:** Instant Rollback to prior Vercel deployment → verify `/api/ready` → auth smoke.  
2. **Bad env:** Revert secrets → redeploy/restart → re-audit env.  
3. **Webhook storm:** Disable/rotate Paddle webhook secret → fix → re-enable.  
4. **Bad migration:** Freeze writes → PITR/restore → re-apply known-good migrations only.  

---

## Phase 7 — Executive Release Report

### Release status

| Domain | Status |
|--------|--------|
| Engineering | **COMPLETE** (Ch1–20 Implemented; gates green) |
| Operational | **READY with INCOMPLETE operator items** |
| Commercial | **READY** (Paddle sole path; live config INCOMPLETE) |
| Security | **READY** (no critical findings; live secrets INCOMPLETE) |
| Architecture | **READY** (Ch2 preserved) |
| Production readiness | **READY FOR OPERATOR DEPLOYMENT** |
| Known risks | Medium — operator cutover + deferred typed-write debt |
| Deferred V2 | Typed writes, Stripe archive rename, auth shell parity, AI stubs expansion |

### Recommended release window

Low-traffic weekday with named on-call. Start only after Phase 3 git packaging and checklist sections A–C complete.

### Recommended deployment order

1. Git package + CI green  
2. Staging migrate + smoke (auth, portal, Paddle)  
3. Production secrets + Paddle webhook  
4. Production migrate  
5. Vercel Production promote  
6. Phase 5 smoke  
7. Checklist sign-off  

### Recommended validation order

1. Ready/health  
2. Auth  
3. Dashboard + portal  
4. Billing (non-destructive first)  
5. Cron  
6. SEO robots/sitemap spot-check  
7. Monitoring alerts quiet for soak period  

### Operator checklist pointer

Use [enterprise-release-checklist.md](./enterprise-release-checklist.md) as the binding sign-off artifact. This playbook is the narrative; the checklist is the checkbox record.

---

## Final Decision

# READY FOR OPERATOR DEPLOYMENT

**Justification:** Engineering and documentation gates for Build Bible V2 go-live are satisfied. Chapter 19 conditions that remain **INCOMPLETE** are operator execution items covered by this playbook—not engineering blockers. No **BLOCKED** items.

**Not automatic deployment:** Operators must still execute git packaging, clear INCOMPLETE rows, deploy, and smoke-test. Cursor / Chapter 20 must not commit, push, or deploy.

### If operators cannot start

Treat as **NOT READY** only when a new **BLOCKED** item appears (e.g. CI red on release commit, missing PITR with no backup owner, inability to obtain Paddle live credentials). At authoring time: **none**.

---

## Release Manager attestation

Playbook prepared under Chapter 20 constraints. No product business-logic changes. No git commands executed. No deploy executed.
