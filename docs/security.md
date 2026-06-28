# Security Guide

Security posture for Auroranexis Release Candidate.

## Threat model summary

| Asset | Protection |
|-------|------------|
| Tenant data | Supabase RLS + org-scoped queries |
| Auth sessions | Supabase Auth JWT |
| API secrets | Server-only env vars, never `NEXT_PUBLIC_*` |
| AI prompts & context | Built server-side; not exposed in client bundles |
| Billing | Stripe-hosted checkout & portal; webhook signature verification |

## Authentication

- Supabase Auth handles sign-up, login, session refresh
- Server components and actions use `createClient()` from `@/lib/supabase/server` with cookie-backed sessions
- Unauthenticated users are redirected from dashboard routes

## Authorization (RBAC)

Role-based permissions are defined in `src/lib/rbac/` and checked in server actions before mutations. UI hides unauthorized controls, but **server checks are authoritative**.

Do not rely on client-side permission flags alone.

## Plan gating

Premium features (AI modules, automation, knowledge, etc.) require both RBAC permission and an enabled plan feature. Checks occur in server actions via `getOrganizationPlanContext()`.

## Row Level Security

All organization-owned tables enforce RLS policies tied to membership. The anon key is safe for client use because policies restrict rows to the authenticated user's organizations.

Service role key bypasses RLS — use only in:

- Controlled server paths (webhooks, bootstrap)
- Never import in client components

## Secrets handling

### Safe for client (`NEXT_PUBLIC_*`)

- Supabase URL and anon key
- App URL
- Stripe publishable key

### Server-only (never prefix with `NEXT_PUBLIC_`)

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`, `RESEND_API_KEY`
- All Stripe price IDs used for checkout creation

Access via `@/lib/env.ts` helpers. Files importing server secrets should include `import "server-only"`.

### Integration secrets (Sprint 3–4)

- Stored encrypted in `integration_secrets` with AES-256-GCM (`INTEGRATION_SECRET_KEY`)
- Workflow actions reference `secretId` only — never inline tokens
- Decryption occurs server-side during live execution and is cleared from memory after the request
- Delivery logs never store Authorization headers, webhook secrets, or decrypted values
- Runtime logs at `/automation/integrations/logs` are Owner/Admin only (RLS enforced)
- Diagnostics show vault readiness and counts, not secret values

See [secrets.md](./secrets.md) and [runtime.md](./runtime.md).

## AI security

- Providers live in `src/lib/ai/providers/` with `server-only`
- User input is validated before prompt assembly
- Generated content is validated before persistence
- Usage quotas enforced per organization plan
- Diagnostics show key **presence**, not values

## Stripe

- Checkout sessions created server-side
- Webhooks verified with `STRIPE_WEBHOOK_SECRET`
- Customer portal sessions created server-side with org-scoped customer ids

## Diagnostics

`/settings/diagnostics` is restricted to organization owners/admins. Displays:

- Env var presence (not values)
- Permission matrix
- Plan source and locked features

No raw API keys or webhook secrets are rendered.

## Client portal

Portal routes scope access to individual client records with separate permission checks. Portal users cannot access the main dashboard.

## Reporting vulnerabilities

Report security issues privately to the project maintainers. Do not open public issues for undisclosed vulnerabilities.

## Related

- [architecture.md](./architecture.md)
- [database.md](./database.md) — RLS and policies
