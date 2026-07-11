# Phase 24 — Customer Success Operations & Lifecycle Playbooks

## Overview

Phase 24 turns adoption and retention intelligence into an operational customer success layer. It reuses existing client, risk, incident, report, monitoring, SLA, and AI client-success data sources without duplicating Phase 23 adoption scoring or Phase 22 activation flows.

## Architecture Reused

| System | Reuse |
|--------|-------|
| Phase 23 adoption | `buildAdoptionSnapshot`, dashboard guidance priority |
| Phase 22 activation | `buildActivationSnapshot`, activation-first dashboard ordering |
| AI client data | `buildClientSuccessSnapshot` in `src/lib/ai/client-success/queries.ts` as data source |
| Clients | `listClientsSafe`, `getClientById` |
| Risks | `client_risks` counts + AI snapshot risk signals |
| Incidents | AI snapshot incident counts |
| Reports / schedules | AI snapshot delivery metrics |
| Monitoring | AI snapshot connector health |
| SLA | AI snapshot breach counts |
| RBAC | `sessionHasPermission`, `requireModuleAccess`, authorization matrix |
| Analytics | consent-gated `trackAnalyticsEvent` |
| Migrations | idempotent pattern with explicit `GRANT` + RLS |

## Domain (`src/lib/customer-success/`)

- `types.ts` — `ClientSuccessSnapshot`, portfolio, timeline, action results
- `constants.ts` — health weights, 12 built-in playbooks
- `health.ts` — deterministic 0–100 health score
- `signals.ts` — positive/negative/value signals from real data
- `playbook-engine.ts` — `resolveSuggestedPlaybooks` (max 3)
- `queries.ts` — playbook instances and tasks
- `task-engine.ts` — task generation and overdue detection
- `recovery.ts` — post-intervention recovery status
- `timeline.ts` — `buildClientSuccessTimeline`
- `metrics.ts` — portfolio queue, workload, metrics
- `snapshot.ts` — `buildClientSuccessSnapshot`, `buildCustomerSuccessPortfolio`
- `actions.ts` — server actions for playbook/task lifecycle
- `events.ts` — analytics prop helpers
- `guards.ts` — permission helpers

## Client Health Formula

Total score = sum of seven bounded components (0–100):

| Component | Weight |
|-----------|--------|
| Delivery consistency | 25 |
| Risk exposure | 20 |
| Incident stability | 15 |
| Customer engagement | 15 |
| SLA / service reliability | 10 |
| Portal and reporting visibility | 10 |
| Success task execution | 5 |

Unavailable plan features (risks, incidents, SLA) receive full component credit rather than penalizing the client.

New clients (≤14 days) receive grace on delivery and risk scoring. No published reports on a brand-new client yields `insufficient_data`, not critical.

## Health Statuses

- `healthy` — score ≥ 70, no critical risks, < 2 open incidents
- `stable` — score 55–69
- `watch` — score 40–54
- `at_risk` — score < 40
- `critical` — critical risks or ≥ 2 open incidents
- `insufficient_data` — new client without delivery history

## Playbook Registry

Twelve code-defined playbooks in `SUCCESS_PLAYBOOK_REGISTRY`:

1. Client onboarding recovery
2. Report delivery recovery
3. Risk remediation
4. Incident recovery
5. Monitoring activation
6. Client portal activation
7. Engagement reactivation
8. SLA recovery
9. Executive review preparation
10. Expansion readiness
11. Renewal risk intervention
12. Low-profitability review

## Suggestion Engine

- Matches signal codes to playbook `triggerCodes`
- Max 3 suggestions, sorted by priority (urgent > high > medium > low)
- Skips playbooks already active/paused/suggested for the client
- Marks plan-gated playbooks as `available: false`
- Checks RBAC via `requiredPermissions`

## Task Lifecycle

Statuses: `open`, `in_progress`, `completed`, `skipped`, `cancelled`

Tasks are created from playbook templates on start with `offsetDays`-based due dates.

## Recovery Rules

On playbook start: capture `recovery_score_before` and trigger snapshot.

On completion: capture `recovery_score_after` and outcome.

Recovery statuses:

- `not_started` — no completed playbooks
- `intervention_active` — active playbook, no measurable improvement yet
- `improving` — active playbook with +10 health during intervention
- `recovered` — completed playbook with +15 score and recent positive signal
- `unresolved` — completed without sufficient improvement
- `worsened` — score declined post-intervention
- `insufficient_data` — no baseline

## Database Schema

### `customer_success_playbook_instances`

Playbook runs per client with status, assignment, recovery scores, trigger metadata.

### `customer_success_tasks`

Checklist items per playbook instance with assignment and due dates.

Partial unique index: one active instance per `organization_id + client_id + playbook_key`.

## Grants

```sql
GRANT SELECT, INSERT, UPDATE ON public.customer_success_playbook_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_success_tasks TO authenticated;
GRANT ALL ON TABLE ... TO service_role;
```

## RLS

- SELECT: organization members via `current_organization_id()`
- INSERT/UPDATE playbooks: owner/admin/manager or assignee
- INSERT/UPDATE tasks: owner/admin/manager or task assignee

## RBAC Permissions

- `customer_success.read` — portfolio and client workspace
- `customer_success.write` — start/pause/cancel playbooks
- `customer_success.assign` — assign playbooks and tasks
- `customer_success.complete` — complete tasks
- `customer_success.manage` — renewal-risk and org-wide management

Mapped to owner/admin (full), manager (operational), analyst (read + complete), member/readonly (read).

## Plan Entitlements

Core workflows available on Starter/Professional. Playbooks with `requiredFeatures` (reports, risks, incidents, customer_portal, sla_tracking, profitability) respect plan gates. Locked playbooks shown as unavailable; health scoring excludes unavailable features.

## Routes

- `/customer-success` — portfolio operations hub
- `/clients/[id]/success` — per-client success workspace

## Dashboard Integration

Priority order:

1. Incomplete activation
2. Critical adoption risk
3. Critical customer success work
4. Adoption summary
5. Compact customer success summary

## Analytics Events

Consent-gated, production-only, no PII:

`customer_success_page_viewed`, `client_success_viewed`, `success_playbook_suggested`, `success_playbook_started`, `success_playbook_assigned`, `success_playbook_completed`, `success_playbook_cancelled`, `success_task_started`, `success_task_completed`, `success_task_overdue`, `client_health_changed`, `client_recovery_detected`, `client_recovery_failed`, `customer_success_summary_viewed`

## Performance

- Organization-scoped queries with indexes on status, client_id, due_at
- Portfolio limited to 50 clients per page
- Parallel independent reads per snapshot
- Server Components by default; client components for interactions only

## Limitations

- Portfolio builds snapshots sequentially per client (batched to 50)
- Email notifications deferred; in-app notification wiring optional
- `/clients/success` (AI portfolio) coexists with `/customer-success` (operational)
- Large orgs may need background aggregation in a future phase

## QA Checklist

- [ ] `/customer-success` loads for owner/admin/manager
- [ ] `/clients/[id]/success` shows health breakdown and tasks
- [ ] Start playbook creates instance + tasks
- [ ] Complete task updates status
- [ ] Dashboard shows CS panel after activation/adoption gates pass
- [ ] Nav shows Customer Success for permitted roles
- [ ] `/adoption` and `/onboarding` unchanged
- [ ] Migration grants verified in Supabase SQL Editor
- [ ] RLS blocks cross-org access
