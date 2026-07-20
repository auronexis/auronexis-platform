# Auroranexis Build Bible V2 — Chapter 2: Architecture Principles

**Status:** Implemented (architecture audit + remediation complete; not released)  
**Version:** 2.0 Chapter 2  
**Priority:** After Chapter 1 foundation rules

Validation gates for this chapter: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch2`.
Do not commit, push, or deploy in Chapter 2 — Release chapters own shipping.

## Core layering

| Layer | Location | May contain | Must not contain |
|-------|----------|-------------|------------------|
| Presentation | `src/components/**`, page UI JSX | Rendering, local UI state | Business rules, DB access, entitlement decisions |
| Pages / layouts | `src/app/**/page.tsx`, `layout.tsx` | Composition, auth gates, data loading orchestration | Business algorithms, direct multi-step domain logic |
| API routes | `src/app/api/**/route.ts` | Auth, parse, call service, return response | UI, duplicated domain logic |
| Services | `src/lib/**` | Business logic, DB access, integrations | React components |
| Client boundary | `"use client"` files | Hooks, interactive UI | `server-only`, admin/server Supabase, secrets |

## Non-negotiables

- Paddle-only billing; never reintroduce Stripe runtime.
- Preserve RBAC, RLS, API contracts, DB contracts, and feature behaviour.
- No TODO/FIXME, placeholders, or temporary architecture.
- Shared logic exists once; consolidate duplicates.
- Release/deploy only in Release chapters — Chapter 2 does not commit/push/deploy.
