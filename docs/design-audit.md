# Aurora Design Audit — Phase 4.5

Global UI consistency pass across Auroranexis. Goal: zero unreadable pages, zero hardcoded white surfaces in dark theme, consistent Aurora token usage.

**Audit date:** June 2025  
**Scope:** All dashboard, portal, auth, settings, and shared components  
**Out of scope:** Email HTML templates (require client-safe inline styles), branding default hex constants (data layer), switch thumb contrast (`bg-white` intentional)

---

## Design system additions

| Token / component | Status |
|-------------------|--------|
| `bg-surface-1`, `bg-surface-2` | Added to `globals.css` with dark-mode values |
| `border-border-subtle` | Added to `globals.css` |
| `.text-secondary` utility | Added (`--color-text-secondary`) |
| `AuroraCard`, `AuroraSection`, `PageShell` | Added in `src/components/ui/aurora-primitives.tsx` |
| `auroraFormSurfaceClass`, `auroraEmptyStateClass` | Shared class constants for forms |

Dark theme (`html.dark`) now maps surfaces to navy tones — no `#ffffff` cards when dark mode is active.

---

## Audit findings by area

### Dashboard

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/dashboard` | Command center cards already used aurora surfaces | Low | Verified | None |
| `/dashboard/insights` | Module accents use semantic primary | Low | Verified | None |
| `/dashboard/predictive` | Already tokenized | Low | Verified | None |
| `/dashboard/compliance` | Uses PageSurface / semantic tokens | Low | Verified | None |
| `/notifications` | `text-slate-500` breadcrumb | Medium | → `text-muted` | None |

### Clients

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/clients/new` | Legacy white form card | High | → `bg-surface-1 border-border-subtle` | None |
| `/clients/[id]` | Uses DetailPageHeader + PageSurface | Low | Verified | None |
| `/clients/success` | Already tokenized | Low | Verified | None |
| Client status badges | `bg-slate-100 text-slate-*` | Medium | → `bg-muted/10 text-muted` | None |

### Reports & templates

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/reports/templates/new` | Legacy white form card | High | → Aurora surface tokens | None |
| `/reports/schedules/new` | Dashed empty + white card | High | → `bg-surface-1` | None |
| Report status badges | Slate neutral tone | Medium | → semantic muted tokens | None |
| Report email history | `bg-slate-50 hover:bg-slate-50` | Medium | → `bg-surface-2` | None |

### Risks & incidents

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/risks/new`, `/incidents/new` | White form cards + slate empty states | High | → Aurora surface tokens | None |
| `/risks/[id]`, `/incidents/[id]` | DetailPageHeader pattern | Low | Verified | None |
| Risk/incident badges | Slate neutral rings | Medium | → `bg-muted/10 ring-border/20` | None |

### Automation, integrations, connectors

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/automation/*` | Uses Card / aurora surfaces | Low | Verified | None |
| Integration workspaces | Primary/status chips tokenized | Low | Verified | None |
| `/automation/connectors` | Semantic button tokens | Low | Verified | None |

### Knowledge & predictive

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/knowledge` | PageSurface + aurora panels | Low | Verified | None |
| `/dashboard/predictive` | Tokenized workspace | Low | Verified | None |

### Compliance & billing

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/dashboard/compliance` | PageSurface components | Low | Verified | None |
| `/settings/billing`, `/settings/usage` | `text-slate-500` breadcrumbs | Medium | → `text-muted` | None |

### Settings & diagnostics

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/settings/team`, `/settings/email` | White form cards | High | → `bg-surface-1` | None |
| `/settings/sla/*`, `/settings/escalation/*` | Multiple white cards + slate text | High | → Aurora tokens | None |
| `/settings/branding` | Preview `#F8FAFC` hardcode | Medium | → `bg-surface-2` | None |
| White label workspace | Preview `bg-white` card | High | → `bg-surface-1` | Brand var fallbacks use CSS vars |
| `/settings/diagnostics` | PageSurface panels | Low | Verified | None |
| Settings nav card | `group-hover:border-slate-400/30` | Low | → `border-border-subtle` | None |
| SLA policy sections | Slate borders/backgrounds | Medium | → `border-border-subtle bg-surface-2` | None |

### White label

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/settings/branding` | Hex preview surfaces | Medium | → semantic surfaces | Default hex in form placeholders (intentional) |
| Theme injector | CSS variables | Low | Verified | None |

### Portal

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `portal-ui.tsx` | 30+ hex/slate/white classes | **Critical** | Full rewrite to Aurora + semantic status colors | None |
| Portal dashboard | `#071A3D`, `text-slate-500` | High | → `text-foreground`, `text-muted` | None |
| Portal reports/risks/incidents | Table hover `#F8FAFC`, slate dividers | High | → `hover:bg-surface-2`, `divide-border-subtle` | None |
| Portal report detail | Hex link/title colors | High | → `text-primary`, `text-foreground` | None |
| Portal shell (dark hero) | Slate on gradient hero | Medium | → `text-muted`, `text-primary-foreground` | `bg-white/5` overlays intentional on dark hero |
| `/client-portal/login` | White login card | High | → `bg-surface-1` | None |

### Auth & team

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/login`, `/signup` | Slate helper text | Medium | → `text-muted` | None |
| `/invite/[token]` | White cards | High | → `bg-surface-1` | None |
| Login branding shell | `#F8FAFC` page bg | Medium | → `bg-surface-2` | None |
| Team member badges | Slate neutral | Medium | → semantic tokens | None |

### Pricing & API

| Page | Issue | Severity | Fix applied | Remaining debt |
|------|-------|----------|-------------|----------------|
| `/pricing` | Pricing cards use primary tokens | Low | Verified | None |
| `/settings/api` | PageSurface workspace | Low | Verified | None |

### Layout & navigation

| Component | Issue | Severity | Fix applied | Remaining debt |
|-----------|-------|----------|-------------|----------------|
| `PageHeader` | `from-surface` gradient | Medium | → `from-surface-1 to-surface-2` | None |
| `Card` glass variant | `bg-surface/90` | Medium | → `bg-surface-1/90` | None |
| Sidebar nav | `text-slate-*` on navy | Low | → `text-muted` (dark sidebar) | `hover:bg-white/5` intentional overlay |
| Workspace switcher | Slate labels | Low | → `text-muted` | None |
| Activity timelines | `bg-slate-500` dots | Low | → `bg-muted` | None |

### Shared UI

| Component | Issue | Severity | Fix applied | Remaining debt |
|-----------|-------|----------|-------------|----------------|
| `Dialog` | Already uses `bg-surface` | Low | Verified | None |
| `Input`, `Select`, `Textarea` | Semantic focus tokens | Low | Verified | None |
| `Switch` | White thumb | Low | **Kept** (contrast on track) | None |
| `Table` / aurora table tokens | Centralized in `aurora.ts` | Medium | Updated shell/head classes | Migrate remaining raw tables incrementally |

---

## Severity summary

| Severity | Count (fixed) | Description |
|----------|---------------|-------------|
| Critical | 1 | Portal UI kit hardcoded palette |
| High | 18 | White cards in themed surfaces, unreadable contrast risk in dark mode |
| Medium | 24 | Slate text, hex colors, inconsistent borders |
| Low | 12 | Sidebar overlays, verified OK surfaces |

---

## Remaining intentional debt

| Item | Reason |
|------|--------|
| `lib/branding/defaults.ts` hex constants | Brand data defaults, not UI classes |
| `lib/white-label/themes.ts` hex defaults | Theme seed values |
| `lib/email/report-email-template.ts` inline styles | Email client compatibility |
| `components/ui/switch.tsx` `bg-white` thumb | Track contrast requirement |
| Sidebar `bg-white/5` hover overlays | Glass effect on dark navy sidebar |
| Portal hero `bg-white/5` buttons | Glass on branded gradient hero |
| `portal-theme.ts` hex constants | Legacy reference palette for health display helpers |
| Some module accent colors in `aurora.ts` (emerald, violet, etc.) | Intentional module identity colors |

---

## Migration reference

| Legacy | Aurora replacement |
|--------|-------------------|
| `bg-white` (cards) | `bg-surface-1` |
| `bg-[#F8FAFC]`, `bg-slate-50` | `bg-surface-2` |
| `text-slate-500/600/400` | `text-muted` / `text-secondary` |
| `text-[#071A3D]` | `text-foreground` |
| `text-[#2563EB]` | `text-primary` |
| `border-slate-200` | `border-border-subtle` |
| `border-slate-300` | `border-border-strong` |
| `rounded-lg … bg-white p-6 shadow-sm` | `rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm` |
| Portal table classes | `auroraTableShell`, `auroraTableHeaderCell`, `auroraTableCell` |

---

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

All three must pass after this audit.

---

## Next steps (optional)

1. Adopt `PageShell` + `AuroraSection` in remaining settings pages for header consistency
2. Migrate compliance/automation tables to `DataTableShell` where raw `<table>` remains
3. Add `compliance` and `billing` module entries to `AURORA_MODULES` in `aurora.ts`
4. Visual regression pass in both light and dark theme via user preferences
