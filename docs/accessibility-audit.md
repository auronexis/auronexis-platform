# Accessibility Audit — Sprint 10

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Target:** WCAG 2.1 AA — no critical blockers for pilot  
**Method:** Component and route static analysis

## Summary

| Area | PASS | WARN | FAIL | Critical |
|------|------|------|------|----------|
| Icon button labels | 13 | 1 | 0 | 0 |
| Dialog ARIA / focus | 3 | 3 | 0 | 0 |
| Form labels | 9 | 3 | 0 | 0 |
| Role usage | 6 | 4 | 0 | 0 |
| Skip links | 1 | 0 | 0 | 0 |
| Color / contrast | 4 | 4 | 1 | 0 |

**Verdict:** **Pilot-ready** with documented WARN items. No critical WCAG failures block keyboard or screen reader access on primary flows after Sprint 10 fixes.

---

## Fixes applied (Sprint 10)

| Issue | Fix |
|-------|-----|
| No skip link | Added `SkipLink` to dashboard and portal shells |
| Collapsed sidebar unnamed links | `aria-label={item.label}` when sidebar collapsed |
| Auth errors not announced | Login/signup use `FormAlert` with `role="alert"` |
| Missing error recovery UI | Dashboard and portal `error.tsx` boundaries |

---

## Icon buttons

### PASS
- Topbar menu/settings, global search, help menu, user menu, notification link
- Toast dismiss, AI panel close, `ClickableRow` / `LinkOverlay` required labels
- Decorative icons marked `aria-hidden`

### WARN
- Sidebar locked tooltip uses `role="tooltip"` on static span

### Fixed in Sprint 10
- Collapsed sidebar links now expose `aria-label`

---

## Dialogs & focus

### PASS
- `ConfirmDialog`: `aria-labelledby`, `aria-describedby`, `aria-modal="true"`
- Send report email: labelled native dialog
- Global search: `role="dialog"`, `aria-modal`, sr-only input label

### WARN
- Base `Dialog` component missing `aria-modal` (unused)
- No focus return after custom dialog close
- Help/user menus: menu roles without arrow-key roving tabindex

---

## Form labels

### PASS
- `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` associate labels and errors
- CRUD forms use labelled primitives throughout

### WARN
- Accept-invite errors not using `FormAlert`
- White-label file upload filename not exposed to AT
- Auth errors now fixed on login/signup; invite flow pending

---

## Roles & landmarks

### PASS
- `<main id="main-content">` on dashboard and portal
- Sidebar `nav` with `aria-label="Primary"`
- Toast `role="status"`, `aria-live="polite"`
- Knowledge hub partial tab pattern

### WARN
- Knowledge tabs missing `role="tabpanel"` / `aria-controls`
- Global search listbox on `<Link>` elements (non-standard)
- Activity filter tabs lack `nav` landmark and `aria-current`

---

## Skip navigation

### PASS (fixed Sprint 10)
- Skip link visible on focus, targets `#main-content`

---

## Color & contrast

### PASS
- Semantic token system in `globals.css`
- Dark mode surface remapping for core text/background
- `.focus-ring` utility for keyboard focus visibility

### WARN
- Dark mode incomplete for warning/success/danger semantic tokens
- `text-muted` borderline AA on light surfaces
- Hardcoded Tailwind color clusters in legacy components

### FAIL (non-critical)
- Global `:focus { outline: none }` requires every interactive to use `.focus-ring` — audit spot-check shows primary controls covered; custom one-offs remain a risk

---

## WCAG AA checklist (spot)

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.4.3 Contrast (AA) | WARN | Legacy hardcoded badges |
| 2.1.1 Keyboard | PASS | Primary flows keyboard operable |
| 2.4.1 Bypass blocks | PASS | Skip link added |
| 2.4.3 Focus order | PASS | Logical on main flows |
| 2.4.7 Focus visible | WARN | Relies on `.focus-ring` convention |
| 3.3.1 Error identification | PASS | Form fields + FormAlert |
| 4.1.2 Name, role, value | WARN | Knowledge tabs, search listbox |

---

## Remaining backlog

1. Accept-invite `FormAlert`
2. Knowledge hub complete tabs pattern
3. Notification bell keyboard panel
4. Dark-mode semantic status tokens
5. `scope="col"` on table headers

## Related

- [ux-audit.md](./ux-audit.md)
- [launch-readiness-report.md](./launch-readiness-report.md)
