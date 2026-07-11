# Phase 22 — Conversion, Trial Onboarding & Customer Activation

Production activation system connecting marketing traffic to measurable workspace value.

## Executive summary

Phase 22 implements a deterministic customer activation system that guides new workspace owners from signup through first operational insight. It evolves the existing dashboard workspace guidance into a centralized activation model with an onboarding hub, dashboard activation panel, first-login welcome, next-best-action engine, and analytics integration — without duplicating billing, auth, or RBAC systems.

## Existing architecture reused

| System | Location |
|--------|----------|
| Workspace guidance | `src/lib/dashboard/workspace-guidance.ts` (evolved, not replaced) |
| Dashboard intelligence | Phase 12 executive panels unchanged |
| RBAC | `sessionHasPermission`, `canManageOrganizationSettings` |
| Plan entitlements | `OrganizationPlanContext.features` |
| Analytics | `trackAnalyticsEvent`, consent gate, production runtime |
| UI primitives | `Button`, `LinkButton`, `EmptyState`, `DashboardPanel` |
| Server actions | Typed `ActivationActionState`, `resolveActionError` |

## Activation model

```
src/lib/activation/
  types.ts           — stages, steps, snapshot types
  steps.ts           — step definitions + completion from real data
  scoring.ts         — stage resolution + progress %
  queries.ts         — lightweight parallel count queries
  preferences-db.ts  — dismiss/view/milestone persistence
  status.ts          — buildActivationSnapshot()
  recommendations.ts — deterministic next-best-action engine
  events.ts          — analytics helpers (no PII)
  actions.ts         — dismiss, record view, milestone
  cta.ts             — in-app activation CTA presets
  empty-states.ts    — shared empty-state copy
  index.ts
```

## Activation stages

| Stage | Threshold |
|-------|-----------|
| `not_started` | Only workspace exists (≤1 applicable step complete) |
| `getting_started` | Account exists, no client yet |
| `building_foundation` | Client exists, first-value milestone not reached |
| `operational` | First value reached, <55% applicable steps or required steps incomplete |
| `activated` | First value + ≥55% progress, <80% complete |
| `mature` | ≥80% applicable steps complete |

**First value milestone:** first client + (first report OR first risk/incident).

## Activation steps

| Step | Category | Required when applicable |
|------|----------|------------------------|
| Workspace created | Foundation | Yes |
| Organization profile | Foundation | Optional |
| First client | Foundation | Yes |
| First report | Operations | Yes (if reports enabled) |
| First operational record | Operations | Yes (if risks/incidents enabled) |
| SLA policy | Operations | Optional |
| Team invited | Collaboration | Optional |
| Monitoring connector | Operations | Optional |
| Portal user | Customer visibility | Optional |
| Billing reviewed | Commercial | Optional |

Locked plan features are excluded from the denominator — they never block activation.

## Role behavior

| Role | Behavior |
|------|----------|
| Owner/Admin | Full setup path, dismiss surfaces, billing tasks |
| Staff (analyst/manager) | Write actions matching permissions; no owner-only blockers |
| Viewer (readonly) | Read-only orientation next-best-action; no write CTAs |

## Plan behavior

- Core activation possible on free/starter without paid plan
- Locked features marked optional/unavailable with upgrade context
- Billing issues prioritized; unpaid blocks checkout recommendations
- Steps adapt to `planContext.features` — not page visits

## Database changes

Migration: `supabase/migrations/20250703000000_activation_system.sql`

Table: `organization_activation_preferences`
- `welcome_dismissed_at`
- `onboarding_dismissed_at`
- `onboarding_last_viewed_at`
- `activation_milestone_reached_at`

RLS: SELECT for org members; INSERT/UPDATE for owner/admin only.

## Analytics events

Extended `src/lib/analytics/events.ts`:

- `onboarding_viewed`, `onboarding_started`, `onboarding_dismissed`
- `onboarding_step_viewed`, `onboarding_step_completed`
- `activation_stage_changed`, `activation_milestone_reached`
- `next_best_action_clicked`, `workspace_activated`
- `first_client_created`, `first_report_created`, `first_risk_created`, `first_incident_created`

Safe props only: `step_id`, `activation_stage`, `completion_percentage`, `source_route`, `plan_key`, `role`, `module`, `locked`, `optional`.

Production + consent gated. Milestone deduplication via sessionStorage.

## CTA architecture

In-app presets in `src/lib/activation/cta.ts`. `ActivationCtaLink` wraps `LinkButton` with analytics — not MarketingButton (authenticated app).

## Dashboard integration

- `ActivationWelcome` — first-login surface (dismissible, max 3 actions)
- `ActivationPanel` — replaces beginner `WorkspaceProgress` for new workspaces
- `WorkspaceMaturityCard` — compact card for mature workspaces
- Executive intelligence section unchanged

## Onboarding hub

Route: `/onboarding`

Sections: activation overview, first-value milestone, workspace readiness categories, recommended setup path, dismiss + resume.

## Empty-state improvements

Updated: clients list, report/risk/monitoring empty states (LinkButton pattern, setup hub links).

## Error handling

All activation actions use `requireSession`, permission checks, typed results, sanitized errors.

## Performance

- Parallel `Promise.all` for activation counts
- Reuses dashboard data where passed in (open risks, monitoring connectors)
- Server Components for hub and dashboard surfaces
- No duplicate analytics scripts

## Manual QA checklist

- [ ] New owner signup → dashboard shows welcome
- [ ] Welcome dismiss persists (owner/admin)
- [ ] `/onboarding` shows progress from real data
- [ ] First client → stage advances
- [ ] Client + report/risk → first value milestone
- [ ] Mature workspace hides beginner panel
- [ ] Viewer sees read-only orientation
- [ ] Locked features don't block progress %
- [ ] Analytics events fire in production after consent
- [ ] No hydration errors on dashboard/onboarding
- [ ] Stripe/billing/auth unchanged

## Known limitations

- Activation preferences are org-scoped (not per-user)
- Milestone analytics dedupe is session-scoped
- `organization_profile` completion uses proxy (client or team activity)
- Supabase table typing uses `as never` pattern (union limit)

## Owner tasks after deployment

1. Apply migration: `supabase db push` or run SQL in Supabase dashboard
2. Verify `/onboarding` and dashboard activation panel in production
3. Confirm analytics events in Plausible after consent
4. Optional: wire `first_client_created` etc. in client/report server actions
