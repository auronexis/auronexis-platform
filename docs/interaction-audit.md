# Interaction Audit — Phase 4.5

Click target and interactive surface consistency pass. Ensures rows and cards that look clickable navigate on full-surface click, with valid HTML and keyboard support.

---

## Shared components

| Component | Path | Purpose |
|-----------|------|---------|
| `ClickableRow` | `src/components/ui/clickable-row.tsx` | Full-width table row navigation (click, Enter, Space) |
| `LinkOverlay` | `src/components/ui/interactive-surface.tsx` | Stretched link over relative parent |
| `ClickableCard` | `src/components/ui/interactive-surface.tsx` | Card with link overlay |
| `InteractiveSurface` | `src/components/ui/interactive-surface.tsx` | Relative wrapper for overlays |
| `RowInteractiveLink` | `src/components/ui/interactive-surface.tsx` | Secondary in-row links (stop row navigation) |

`AuroraTableRow` now defaults to `interactive={false}`. Use `ClickableRow` when the row navigates.

Nested controls use `data-row-interactive` and `relative z-10` so row/card navigation ignores them.

---

## Audit findings

### Reports

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| `/reports` (`report-list.tsx`) | Row hover + pointer; only title link worked | `ClickableRow` → report detail; `RowInteractiveLink` for client column | None |
| `/reports/templates` | Same pattern | `ClickableRow` → template detail | None |
| `/reports/schedules` | Same pattern | `ClickableRow` → schedule detail | None |
| Report detail email history | Row hover without navigation | Removed `hover:bg-muted/10` | None |
| Dashboard upcoming schedules | Partial link (title only) | Full-surface `Link` with `aria-label` | None |

### Clients

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| `/clients` (`client-list.tsx`) | Row hover; only name link worked | `ClickableRow` → client detail | None |
| `/profitability` | Row hover; only name link; Edit button conflict | `ClickableRow` + `data-row-interactive` on Edit | None |

### Risks & incidents

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| `/risks` | Row hover; only title link | `ClickableRow` + client `RowInteractiveLink` | None |
| `/incidents` | Same | `ClickableRow` + client `RowInteractiveLink` | None |

### Settings

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| SLA policies list | Row hover; only name link | `ClickableRow` | None |
| Escalation rules list | Row hover; only name link | `ClickableRow` | None |
| Settings nav cards | Hover on full card | Already full `Link` wrapper | None |
| Team members list | Row looked interactive; actions-only | `interactive={false}` on `AuroraTableRow` | None |

### Automation

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Automation dashboard cards | `auroraSurfaceInteractive` + title link only | `InteractiveSurface` + `LinkOverlay`; action buttons `data-row-interactive` | None |

### Knowledge

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Resolved incidents list | Title link only; card looked static | `InteractiveSurface` + `LinkOverlay`; Generate button isolated | Search result snippet links remain text-only (intentional) |

### Portal

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Portal reports table | Row hover; actions only | `ClickableRow` + interactive action column | None |
| Portal incidents/risks | Row hover without navigation | Removed row hover | None (read-only lists) |
| Portal KPI cards | Full card link via `PortalKpiCard` | Verified | None |

### Pricing & billing

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Pricing cards | Card hover; only button actionable | Removed card hover lift; button remains primary action | None |
| Billing settings | No false row hovers | Verified | None |
| Connectors workspace | Action buttons only; no false card hover | Verified | None |

### Compliance & predictive

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Audit explorer timeline | Static rows; explicit “Open entity” link | No change needed | Optional: full-row click when deep link exists |
| Predictive workspace | Text links in list items | No false row hover | Optional future: `ClickableCard` on recommendation tiles |

### Notifications

| Page / component | Issue | Fix applied | Remaining debt |
|------------------|-------|-------------|----------------|
| Notification list | List item hover wider than link | Link wraps primary content; Mark read is separate control | Optional: unify with overlay pattern |

---

## HTML & accessibility rules enforced

1. No nested `<a>` inside `<a>` — overlay pattern uses one link + z-index layers
2. No nested `<button>` inside `<button>`
3. `ClickableRow` uses `role="link"`, `tabIndex={0}`, `aria-label`, Enter/Space handlers
4. `focus-visible` ring on clickable rows and overlay links
5. Interactive children use `data-row-interactive` to opt out of row navigation

---

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

Manual checks:

- Click anywhere on a `/reports` row (not client link) → opens report detail
- Tab to row → Enter navigates
- Client link in report row still opens client page
- Automation card: click body opens workflow; buttons activate/disable/delete work
- No nested anchor console warnings

---

## Remaining optional debt

| Item | Reason deferred |
|------|-----------------|
| Audit explorer event rows | Low traffic; explicit link sufficient |
| Predictive recommendation cards | Mixed href/no-href items |
| Notification list full-row pattern | Mark-read button requires split target |
| API keys list | Inline revoke actions; no row-level navigation |
