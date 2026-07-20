# Auroranexis Build Bible V2 — Chapter 10: Enterprise Accessibility (WCAG 2.2 AA)

**Status:** Implemented  
**Version:** 2.0 Chapter 10  
**Priority:** After Chapter 9 I18N

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch10-accessibility.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Focus helpers | `src/lib/a11y/focus.ts` |
| Focus ring token | `src/lib/ui/tokens.ts` (`focusRing`) |
| Skip link | `src/components/ui/skip-link.tsx` |
| Dialog / confirm | `src/components/ui/dialog.tsx`, `confirm-dialog.tsx` |
| Tables | `src/components/ui/table.tsx` (`scope="col"`, `AuroraTableCaption`) |
| Marketing landmarks | `src/components/marketing/marketing-shell.tsx` |
| Auth/portal login landmarks | `src/components/branding/login-branding-shell.tsx` |
| Prior audit reference | `docs/accessibility-audit.md` (superseded for V2 by this chapter) |

## Non-negotiables

- Target WCAG 2.2 AA without redesigning UI or changing business behaviour
- Prefer native HTML semantics; use ARIA only when required
- Never remove visible focus indicators
- Do not change auth, RBAC, RLS, Paddle billing, API contracts, or SEO behaviour
- Loading and error states must remain understandable to assistive technology

## Shell landmarks

Every major surface must expose:

- `SkipLink` → `#main-content`
- A single `<main id="main-content" tabIndex={-1}>` landmark

Applies to dashboard, client portal, marketing, and login shells.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch10`.

Do not commit, push, or deploy in Chapter 10 — Release chapters own shipping.
