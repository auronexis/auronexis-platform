# Phase 30.3 — Communication & Contact Infrastructure (Enterprise)

Production-grade communication and contact infrastructure for Auroranexis: consistent enterprise contact channels, corrected email routing, and accurate public AI health status.

## Summary

| Area | Change |
|------|--------|
| Contact source of truth | `src/lib/company/company-contact.ts` — fixed `salesEmail`, added `privacyEmail`, `partnersEmail`, `pressEmail` |
| Enterprise channels | `src/lib/company/contact-channels.ts` — typed channel config with icons, purpose, mailto links, response expectations |
| UI component | `src/components/marketing/enterprise-contact-card.tsx` — reusable responsive contact card |
| Support page | Full enterprise contact grid (8 channels) + self-service resources |
| Contact page | Primary channels (Support, Sales, Security) + future enterprise channels |
| AI status | `resolvePublicAiStatus()` maps configured OpenAI to **Operational** with explicit failure reasons |
| Tests | `scripts/communication-contact.test.mjs` |

## Contact mapping

| Channel | Email | Category |
|---------|-------|----------|
| Support | support@auroranexis.com | Active |
| Sales | sales@auroranexis.com | Active |
| Security | security@auroranexis.com | Active |
| Legal | legal@auroranexis.com | Future (display only) |
| General | info@auroranexis.com | Future (display only) |
| Privacy | privacy@auroranexis.com | Future (display only) |
| Partnerships | partners@auroranexis.com | Future (display only) |
| Press | press@auroranexis.com | Future (display only) |

All public email links use `mailto:` hrefs. Future addresses are displayed as enterprise contact channels without mailbox verification.

## AI status health check

Public `/status` AI component now derives status from `getOpenAIPlatformStatus()` plus `getOpenAIPlatformConfig()`:

- **Operational** — API key configured (`connected` or `configured`)
- **Missing API Key** — provider enabled but no key
- **Provider Disabled** — `AI_ENABLED=false`
- **Invalid Configuration** — non-OpenAI provider
- **API Timeout** / **Provider Unavailable** — degraded with sanitized health errors
- Wrapped in try/catch so the status page never crashes

## Files changed

- `src/lib/company/company-contact.ts`
- `src/lib/company/contact-channels.ts` (new)
- `src/lib/company/index.ts`
- `src/lib/company/contact.ts`
- `src/lib/marketing/public-status.ts`
- `src/lib/marketing/content.ts`
- `src/lib/support/content.ts`
- `src/components/marketing/enterprise-contact-card.tsx` (new)
- `src/app/(marketing)/support/page.tsx`
- `src/app/(marketing)/contact/page.tsx`
- `scripts/communication-contact.test.mjs` (new)
- `scripts/openai-integration.test.mjs`
- `package.json`

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:communication-contact
npm run test:openai-integration
```

## Constraints preserved

No changes to authentication, billing, Stripe, OpenAI client/responses/health modules, database schema, RLS, existing APIs, routing, or middleware.
