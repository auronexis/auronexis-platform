# UX Audit — Sprint 10

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Prior work:** [design-audit.md](./design-audit.md), [interaction-audit.md](./interaction-audit.md)

## Executive summary

The Aurora design system and click-target pass (Phase 4.5) established a solid baseline. Sprint 10 adds route-level loading/error boundaries, skip navigation, and documents remaining polish debt. No misleading primary-list hover issues remain on core modules.

| Area | PASS | WARN | FAIL |
|------|------|------|------|
| Hover / click targets | 10 | 4 | 0 |
| Empty states | 8 | 6 | 0 |
| Loading states | 5 | 2 | 0 |
| Error states | 6 | 2 | 0 |
| Dialogs | 2 | 3 | 0 |
| Tables | 4 | 3 | 0 |
| Page headers | 6 | 2 | 0 |
| Responsive | 5 | 5 | 0 |

---

## Fixes applied (Sprint 10)

| Fix | Files |
|-----|-------|
| Skip-to-content link | `skip-link.tsx`, `dashboard-shell.tsx`, `portal-shell.tsx` |
| Main landmark id | `dashboard-sidebar.tsx` (`#main-content`) |
| Route error boundaries | `(dashboard)/error.tsx`, `client-portal/error.tsx` |
| Segment loading UI | `reports/loading.tsx`, `automation/loading.tsx`, `settings/billing/loading.tsx` |
| Auth error surfaces | `login-form.tsx`, `signup-form.tsx` → `FormAlert` |

---

## Hover & click consistency

### PASS
- `ClickableRow` on clients, reports, templates, schedules, risks, incidents, SLA, escalation, profitability, portal reports
- `AuroraTableRow` default `interactive={false}` prevents false affordances
- Automation cards use `LinkOverlay` with isolated action buttons
- Pricing cards no longer use misleading card-level hover

### WARN
- Notification list: row hover wider than primary link
- Audit explorer: link-only navigation (low traffic)
- Report email history: legacy table styling
- Notification bell preview: hover-only panel (touch/keyboard gap)

---

## Empty states

### PASS
Shared `EmptyState`, `AuroraTableEmpty`, `DetailEmpty` on primary list pages.

### WARN (inconsistent copy/surface)
- `portal-user-list.tsx` — plain paragraph
- `report-email-history.tsx` — no empty component
- `api-settings-workspace.tsx` — silent when no API keys
- `audit-explorer.tsx` — blank timeline when empty
- Knowledge hub tab empty states — minimal one-liners

---

## Loading states

### PASS
- `(dashboard)/loading.tsx` skeleton shell
- New segment loaders: reports, automation, billing
- Form `Button` loading states across CRUD forms
- Automation builder dynamic import with fallback

### WARN
- Portal and auth routes lack dedicated `loading.tsx`
- Automation dashboard client-side store reload may flash empty metrics

---

## Error states

### PASS
- `FormAlert` on settings, compliance, connectors, billing, automation
- Input field errors with `aria-invalid` / `aria-describedby`
- New branded `error.tsx` for dashboard and portal

### WARN
- Accept-invite form still uses raw error styling
- Some destructive actions lack confirm dialogs (automation delete, secrets delete)

---

## Dialogs

### PASS
- `ConfirmDialog` with full ARIA on settings destructive actions
- Send report email dialog with labelled native `<dialog>`

### WARN
- Base `Dialog` primitive unused and missing `aria-modal`
- No explicit focus return after custom dialog close
- Help/user menus lack roving tabindex

---

## Tables

### PASS
- `AuroraDataTable` with horizontal scroll
- Semantic header/cell tokens
- Empty integration on major lists

### WARN
- `report-email-history.tsx` legacy markup
- Wide tables lack sticky first column on mobile
- Most `th` elements missing `scope="col"`

---

## Page headers

### PASS
- `PageHeader` on all primary list routes
- `DetailPageHeader` on entity detail pages
- `ArchiveFilterTabs` with `aria-current`

### WARN
- Nested workspace headers on some settings sub-pages
- Reports list action cluster tight on small tablets

---

## Responsive

### PASS
- Detail layout rail stacks on mobile
- Topbar compact search on small screens
- Portal nav horizontal scroll
- Sidebar off-canvas drawer

### WARN
- Hardcoded light status colors (`bg-emerald-50`, `bg-red-50`) in email history and portal badges
- Activity filter tabs use legacy `bg-navy-900` token
- Knowledge hub control row crowded at `md`

---

## Sprint 10 backlog (non-blocking)

1. Notification bell keyboard/touch panel
2. Confirm dialogs on automation/secrets delete
3. Unify secondary empty states
4. Portal + auth `loading.tsx`
5. Tokenize remaining hardcoded status colors

## Related

- [interaction-audit.md](./interaction-audit.md)
- [accessibility-audit.md](./accessibility-audit.md)
- [design-audit.md](./design-audit.md)
