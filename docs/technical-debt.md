# Technical Debt Catalog

**Maintained by:** Build Bible V2 Chapters 15–16  
**Policy:** Document high-risk items here. Do not auto-implement Critical/High refactors without an explicit chapter or ticket.

| Severity | Description | Impact | Recommended solution | Complexity |
|----------|-------------|--------|----------------------|------------|
| Critical | Widespread `as never` on Supabase insert/update payloads (~90+ files; worst: `sales/actions.ts`) | Masks schema drift; slows safe refactors | Migrate hot paths gradually via `src/lib/supabase/typed.ts` + regenerated DB types | High |
| High | Legacy Stripe-named fields/APIs (`stripeStatus`, `stripeConfigured`, archive diagnostics) | Operator confusion | Compat aliases + UI rename in a dedicated cleanup chapter | High |
| High | Historical Stripe invoice/archive call paths still queried for diagnostics | Extra work in billing diagnostics | Collapse to Paddle-only after archive strategy finalized | Medium–High |
| High | `BillingProvider` union still includes `"stripe"` for archive rows | Needed for historical data | Keep until archive purge policy exists | High |
| Medium | Raw `toLocaleDateString` / `toLocaleString` in some workspace UI | Locale/i18n drift vs org settings | Migrate to `formatAppDate*` / `formatAppDateTime` | Medium |
| Medium | `formatCurrency` profitability alias vs `formatWorkspaceMoney` | Dual money APIs | Point callers at workspace money helpers | Low–Medium |
| Medium | Three `ClientHealthBadge` modules (health / profitability / customer-success) | Naming collision risk | Domain-prefixed renames | Low |
| Low | Historical docs still narrating Stripe eras (remaining pilot/launch notes) | Onboarding noise | Continue archive banners / pointers | Low |

## Explicitly out of scope for automatic Chapter 16 fixes

- Auth / session / RBAC / RLS changes
- Paddle webhook, entitlements, or checkout behaviour
- API v1 response contracts
- Database migrations or RLS policy edits
- Visual redesign of marketing or dashboard layouts
- Mass `as never` elimination
- Speculative architecture for Version 2

## Completed in Chapter 15 (safe)

- Removed unused deprecated exports (`PortalLogoMark`, legacy `MarketingCta`, `getMarketingHeaderNavLinks`, `shouldAttachAppNoIndexHeader`, `buildRiskSummary` / `getRiskMetrics`)
- Removed throw-only Stripe env getters from `src/lib/env.ts`
- Consolidated compact empty states onto `CompactEmptyState`
- Marketing + pipeline badges compose shared `StatusBadge`
- Architecture doc updated to Paddle-only
- Shared test helper migration for Build Bible chapter scripts
- Quality / Chapter 15 contract tests

## Completed in Chapter 16 (safe)

- Removed unused UI: `checkbox.tsx`, `BodyText`, `LabelText`, `EyebrowText`, `DangerZone`
- Removed unused helpers: `wasReportDelivered`, `RiskMetrics` type, `COMPANY_SEO.canonicalBaseUrl`
- Removed empty `src/components/observability/` and broken `export-transparent-logos.mjs`
- Cleared stale AI provider registry comment
- Synchronized billing/website/domain/staging/abuse docs to Paddle
- Wired `npm run verify:domain-routing`
- Full discovery inventory: `docs/technical-debt-inventory-ch16.md`
