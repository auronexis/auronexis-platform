# Phase 23 — Customer Adoption & Retention System

## Overview

Phase 23 extends the Phase 22 activation architecture into a production-grade adoption and retention layer. It answers, per organization:

1. Is the product being used meaningfully?
2. Is recurring customer value being created?
3. Is adoption improving, stable, or declining?
4. Which feature should be adopted next?
5. Is the organization at retention risk?
6. What action should the user take now?

All calculations use real database data. No demo values. No organization-specific hardcoding.

## Reused Architecture

| Layer | Reuse |
|-------|-------|
| Session / tenancy | `requireSession()`, `current_organization_id()` |
| Plan entitlements | `OrganizationPlanContext`, `isFeatureEnabled()` |
| RBAC | `sessionHasPermission()`, `canInviteTeamMembers()` |
| Activation | `buildActivationSnapshot()` — first-value, stages, completion % |
| Activity feed | `activity_events` with canonical `event_type` values |
| Dashboard shell | `DashboardPanel`, `Card`, `SectionTitle` |
| Analytics | Consent-gated `trackAnalyticsEvent()` |
| Preferences pattern | `organization_adoption_preferences` (Phase 22.3 grants model) |

## Domain Model

Primary entry point:

```typescript
buildAdoptionSnapshot(input) → AdoptionSnapshot
```

Location: `src/lib/adoption/snapshot.ts`

### AdoptionSnapshot

- `score` / `scoreBreakdown` — weighted 0–100
- `stage` — lifecycle stage
- `trend` — 30d vs previous 30d
- `riskLevel` / `riskReasons` — retention risk
- `recommendations` — max 3 deterministic actions
- `featureSignals` — registry-driven adoption state
- `valueEvents30d` / `valueEventsPrevious30d`
- `isActivated` / `isMature` / `hasEnoughData`

## Score Formula

| Category | Weight | Inputs |
|----------|--------|--------|
| Foundation | 20 | Client exists, first-value, activation % |
| Recurring value | 25 | Meaningful events 30d, published reports 30d, active schedules |
| Feature breadth | 20 | Adopted / available features |
| Engagement recency | 15 | Days since last meaningful activity |
| Collaboration | 10 | Active users 30d, team size |
| Customer visibility | 10 | Published reports + customer-facing events |

Unavailable plan features are excluded from the breadth denominator.

## Feature Registry

14 features in `ADOPTION_FEATURE_REGISTRY`:

clients, reports, published_reports, report_scheduling, risks, incidents, monitoring, automations, knowledge, team_collaboration, client_portal, sla, profitability, integrations

## Lifecycle Stages

| Stage | Rule summary |
|-------|----------------|
| `inactive` | No meaningful activity > 30 days |
| `at_risk` | Declining trend + stale activity after prior usage |
| `embedded` | Score ≥ 70, ≥ 5 features, ≥ 2 active users |
| `operational` | Recurring value + recent activity |
| `developing_habits` | ≥ 3 events across ≥ 2 weeks |
| `early_adoption` | Activated, low breadth |
| `newly_activated` | First value reached, forming habits |

## Trend Rules

- `insufficient_data`: not activated OR < 3 combined events
- `improving`: current ≥ previous × 1.2
- `declining`: current ≤ previous × 0.8
- `stable`: otherwise

## Risk Engine

Levels: `healthy`, `watch`, `at_risk`, `critical`, `unknown`

Evidence-based reasons with severity, no PII in evidence strings.

## Recommendations

Separate from Phase 22 activation NBA. Priority-ordered, permission-aware, max 3 visible. No write CTA without permission. Upgrade-only when plan-locked.

## Database

### `organization_adoption_preferences`

- `organization_id` PRIMARY KEY
- `last_viewed_at`, `summary_dismissed_at`
- RLS: org scope + owner/admin writes
- **Grants**: `SELECT, INSERT, UPDATE` for `authenticated`

Migration: `supabase/migrations/20250704000000_adoption_preferences.sql`

No persistent adoption score table — computed from existing tables.

## Routes & UI

- `/adoption` — full Adoption & Retention hub
- `/dashboard` — compact summary via `AdoptionSummaryPanel` when activation complete

### Dashboard priority

1. Activation incomplete → Phase 22 `ActivationPanel`
2. Activation complete + risk → adoption risk guidance
3. Activation complete + healthy → adoption summary
4. Mature / embedded → maturity summary

## Navigation

`Adoption` added to Main sidebar section (`/adoption`, HeartPulse icon). Visible to all dashboard readers.

## RBAC

- Owner/Admin: full page, preference writes, all permitted CTAs
- Manager/Analyst/Member: read adoption, actionable CTAs per permission
- Viewer/Readonly: read-only summary, no write CTAs

## Analytics Events

Consent-gated, production only, no PII:

- `adoption_page_viewed`
- `adoption_score_viewed`
- `adoption_recommendation_clicked`
- `adoption_stage_changed`
- `adoption_trend_changed`
- `retention_risk_detected`
- `retention_risk_resolved`
- `feature_adopted`
- `workspace_reengaged`
- `adoption_summary_viewed`

## Performance

- Parallel `Promise.all` queries
- Bounded 30d / 60d windows
- Organization-scoped filters
- Reuses activation + dashboard data on dashboard page

## Tests

```bash
npm run test:adoption
```

## QA Checklist

- [ ] Owner sees full `/adoption` page with score breakdown
- [ ] Viewer sees read-only recommendations
- [ ] Dashboard shows activation panel when setup incomplete
- [ ] Dashboard shows adoption summary after activation
- [ ] Dismiss/restore activation (Phase 22) still works
- [ ] Migration applied with INSERT/UPDATE grants
- [ ] No raw Supabase errors in browser
- [ ] Analytics fire once per session

## Limitations

- Meaningful activity depends on `activity_events` producers; sparse history falls back to source table counts for feature adoption
- Knowledge is derived (no dedicated table)
- Legacy `risks` table used for counts (aligned with activation)
- Long-term trend history not persisted (computed from 60d window only)
