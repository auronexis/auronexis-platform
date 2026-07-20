# Auroranexis

The Operations Command Center for AI Automation Agencies.

**Monitor clients. Detect risks. Prove value.**

## Stack

- Next.js 15 App Router + TypeScript + Tailwind CSS
- Supabase Auth + PostgreSQL multi-tenancy (RLS)
- RBAC + client portal isolation
- **Paddle** sole active billing provider
- Background jobs / queue via `/api/cron/run`

## Prerequisites

- Node.js 22+ / npm 10+
- [Supabase](https://supabase.com) project
- Paddle sandbox (or production) credentials for billing

## Setup

1. `npm install`
2. `cp .env.example .env.local` — fill Supabase + Paddle + `CRON_SECRET`
3. Apply migrations: `supabase db push` (or SQL editor) — all files under `supabase/migrations/` in timestamp order
4. Configure Supabase Auth Site URL + redirect URLs for your `NEXT_PUBLIC_APP_URL`
5. `npm run dev` → open the app URL

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |
| `npm run test:enterprise-production-golive` | Chapter 20 production go-live playbook gates |
| `npm run test:enterprise-release-approval` | Chapter 19 release board Go/No-Go gates |
| `npm run test:enterprise-certification` | Chapter 18 enterprise certification gates |
| `npm run test:definition-of-done` | Chapter 17 DoD release gates |
| `npm run test:technical-debt` | Chapter 16 debt elimination contracts |
| `npm run test:code-quality` | Chapter 15 maintainability contracts |
| `npm run test:production-readiness` | Chapter 14 deploy readiness contracts |
| `npm run test:enterprise-regression` | Chapter 13+ regression catalog |
| `npm run verify:domain-routing` | Domain redirect safety checks |
| `npm run test:paddle-billing` | Paddle sole-provider suites |

## Production readiness

Canonical ops docs (Build Bible V2 Chapter 14):

- [docs/enterprise-deployment.md](docs/enterprise-deployment.md)
- [docs/enterprise-release-checklist.md](docs/enterprise-release-checklist.md)
- [docs/rollback-plan.md](docs/rollback-plan.md)
- [docs/disaster-recovery.md](docs/disaster-recovery.md)
- [docs/paddle-billing.md](docs/paddle-billing.md)

Definition of Done: [docs/19_BUILD_BIBLE_V2_CHAPTER_17_DEFINITION_OF_DONE.md](docs/19_BUILD_BIBLE_V2_CHAPTER_17_DEFINITION_OF_DONE.md), [docs/enterprise-definition-of-done.md](docs/enterprise-definition-of-done.md), [docs/enterprise-dod-report.md](docs/enterprise-dod-report.md).

Enterprise certification: [docs/20_BUILD_BIBLE_V2_CHAPTER_18_ENTERPRISE_CERTIFICATION.md](docs/20_BUILD_BIBLE_V2_CHAPTER_18_ENTERPRISE_CERTIFICATION.md), [docs/enterprise-certification-report.md](docs/enterprise-certification-report.md).

Release approval: [docs/21_BUILD_BIBLE_V2_CHAPTER_19_RELEASE_APPROVAL.md](docs/21_BUILD_BIBLE_V2_CHAPTER_19_RELEASE_APPROVAL.md), [docs/enterprise-release-approval-report.md](docs/enterprise-release-approval-report.md).

Production go-live: [docs/22_BUILD_BIBLE_V2_CHAPTER_20_PRODUCTION_GOLIVE.md](docs/22_BUILD_BIBLE_V2_CHAPTER_20_PRODUCTION_GOLIVE.md), [docs/enterprise-production-golive-playbook.md](docs/enterprise-production-golive-playbook.md).

Code quality & debt: [docs/17_BUILD_BIBLE_V2_CHAPTER_15_CODE_QUALITY.md](docs/17_BUILD_BIBLE_V2_CHAPTER_15_CODE_QUALITY.md), [docs/18_BUILD_BIBLE_V2_CHAPTER_16_TECHNICAL_DEBT.md](docs/18_BUILD_BIBLE_V2_CHAPTER_16_TECHNICAL_DEBT.md), [docs/technical-debt.md](docs/technical-debt.md).

Do not enable `E2E_DISABLE_RATE_LIMIT` in production.  
Production deploy / commit / push are owned by Release chapters — not local Chapter 14 prep.

## Security model

| Layer | Responsibility |
|-------|----------------|
| PostgreSQL RLS | Organization isolation |
| Server Actions | Role-based authorization |
| Middleware | Session refresh + route protection |
| Paddle webhooks | Signature verify + idempotency |

Legal: `/terms`, `/refund-policy`, `/privacy`, `/imprint`.
