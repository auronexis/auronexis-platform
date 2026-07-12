# Phase 30.2 — Enterprise Analytics & Conversion Tracking

## Overview

Phase 30.2 establishes a unified, privacy-safe analytics and conversion tracking foundation across GA4, Microsoft Clarity, PostHog, and Plausible — without modifying authentication, RBAC, Stripe billing logic, Supabase schema, or AI business logic.

## Architecture

```
src/lib/analytics/taxonomy.ts          — Event categories + canonical names
src/lib/analytics/events.ts          — trackAnalyticsEvent, sinks, sanitization
src/lib/analytics/pending-events.ts  — Post-redirect event queue (sessionStorage)
src/lib/analytics/server-events.ts   — GA4 Measurement Protocol (webhooks)
src/lib/analytics/adoption-metrics.ts — WAU/MAU/feature adoption helpers
src/components/analytics/analytics-provider.tsx — Consent-gated orchestration
```

## Event Taxonomy (snake_case)

| Category | Examples |
|----------|----------|
| Authentication | `signup_started`, `signup_completed`, `login_completed` |
| Workspace | `workspace_created`, `dashboard_loaded`, `activation_completed` |
| Clients | `client_created` |
| Reports | `report_generated`, `report_published`, `ai_summary_generated` |
| Risks / Incidents | `risk_created`, `incident_created` |
| Billing | `subscription_checkout_started`, `subscription_checkout_completed`, `invoice_paid`, `invoice_failed`, `subscription_upgraded`, `subscription_downgraded`, `subscription_cancelled` |
| AI | `ai_summary_generated`, `ai_connection_test_*` |
| Integrations | `integration_connected` |
| Documentation | `documentation_viewed` |
| Marketing | `landing_page_view`, `pricing_view`, `page_view` |

Every event payload includes `event_category` from the taxonomy registry.

## Conversion Funnel

| Event | Trigger |
|-------|---------|
| `landing_page_view` | Homepage route (`/`) |
| `pricing_view` | `/pricing` page mount |
| `signup_started` | Signup page + form submit |
| `signup_completed` | Dashboard first load after new org (<10 min) |
| `workspace_created` | Dashboard first load after new org |
| `subscription_checkout_started` | Pricing grid checkout click |
| `subscription_checkout_completed` | Billing settings `?success=1` + Stripe webhook |
| `invoice_paid` / `invoice_failed` | Stripe webhook (GA4 MP) |
| `subscription_*` lifecycle | Stripe webhook (cancel, downgrade, upgrade) |

## Privacy & Security

**Never transmitted:** emails, tokens, API keys, workspace IDs, Stripe secrets, customer IDs.

Blocked prop keys: `email`, `name`, `phone`, `workspace`, `organization`, `client_id`, `stripe`, `session_id`, etc.

## Consent Model (unchanged)

| Category | Providers |
|----------|-----------|
| Analytics | Plausible, Clarity, PostHog |
| Marketing | GA4 |

Conversion events route to GA4 when marketing consent is granted; all events route to analytics providers when analytics consent is granted.

## GA4 SPA Fix

- `send_page_view: false` in gtag config — prevents duplicate automatic page views
- Manual `page_view` events via `PageViewTracker` with `page_path`
- 400ms dedupe window prevents duplicate rapid-fire events

## Clarity

Unchanged — consent-gated, CSP-allowed, custom events via `claritySink`.

## Server-Side Conversions (Stripe)

Optional GA4 Measurement Protocol via `GA4_API_SECRET` env var. Fires from `src/lib/stripe/webhooks.ts` without altering billing sync logic.

## Adoption Metrics

Client-side helpers (no schema changes):

- `trackWeeklyActiveUsage()` — once per rolling week
- `trackMonthlyActiveUsage()` — once per rolling month
- `trackFeatureAdoption()` — per-feature signals
- `trackWorkspaceHealthViewed()` — health panel impressions

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:analytics-conversion
npm run test:technical-seo
npm run test:openai-integration
```

## Owner Actions (GA4 Realtime)

1. Accept analytics + marketing cookies on production
2. Verify Realtime shows `page_view`, `landing_page_view`, `pricing_view`
3. Complete test signup → confirm `signup_completed`, `workspace_created`
4. Start checkout → confirm `subscription_checkout_started`
5. Configure GA4 conversions for key funnel events
6. Optional: set `GA4_API_SECRET` for server-side webhook conversions

## Decision

**B — CODE COMPLETE — OWNER GA4 REALTIME + CONVERSION CONFIG REQUIRED**
