# Auroranexis Build Bible V2 — Chapter 4: Enterprise UI / UX Design System

**Status:** Implemented (design system audit + remediation complete; not released)  
**Version:** 2.0 Chapter 4  
**Priority:** After Chapter 3 Next.js & TypeScript standards

Validation gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch4`.

Do not commit, push, or deploy in Chapter 4 — Release chapters own shipping.

## Design system sources of truth

| Concern | Location |
|---------|----------|
| Color, radius, shadow, spacing CSS tokens | `src/app/globals.css` (`@theme`) |
| Interactive class fragments | `src/lib/ui/tokens.ts` |
| Form field fragments | `src/lib/ui/form-tokens.ts` |
| Aurora surface primitives | `src/lib/ui/aurora.ts` |
| Motion fragments | `src/lib/ui/motion.ts` |
| Reusable UI components | `src/components/ui/**` |

## Non-negotiables

- One component per concern — merge duplicates; do not invent parallel primitives.
- Prefer semantic tokens (`bg-surface`, `text-muted`, `border-border`) over ad-hoc hex/palette utilities in product UI.
- Forms use shared `Input` / `Select` / `Textarea` / `FormAlert` / `FormSection` patterns.
- Tables use `AuroraTable*` / `DataTableShell` where applicable.
- Empty / loading states use `EmptyState`, `Skeleton`, `RouteLoadingShell`, `LoadingCard`.
- Preserve focus rings (`focusRing` / `.focus-ring`) and WCAG AA contrast where possible.
- Presentation-only changes — no business logic, auth, RBAC, RLS, or Paddle changes.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch4`.

Do not commit, push, or deploy in Chapter 4 — Release chapters own shipping.
