# Legal Pages — Auroranexis v0.975

**Sprint:** Phase 5 Sprint 2.5 — Launch Polish & Legal Foundation

---

## Routes

| Page | URL |
|------|-----|
| Imprint | `/legal/imprint` |
| Privacy | `/legal/privacy` |
| Terms | `/legal/terms` |
| Cookies | `/legal/cookies` |
| Dashboard hub | `/dashboard/legal` |
| Portal hub | `/client-portal/legal` |
| Settings | `/settings/legal` |

---

## Implementation

- Shared layout: `src/components/legal/legal-layout.tsx`
- Content: `src/lib/company/legal-content.ts`
- Inline links: `src/components/legal/legal-links-inline.tsx`

---

## Footer integration

Legal links appear in:

- Dashboard footer (`SiteFooter`)
- Portal footer (`PortalFooter`)
- Login and signup pages

---

## Pilot note

Content is structured for pilot presentation. Have legal counsel review before GA.
