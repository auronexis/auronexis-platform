# Technical Debt Inventory — Chapter 16 Discovery

Generated during Build Bible V2 Chapter 16 Phase 1. Evidence-biased toward **keep**.

## Markers

| Marker | `src/` result |
|--------|----------------|
| TODO / FIXME / HACK / XXX / TEMP | **None** |
| `@deprecated` (live callers) | Keep: `archiveRiskAction`, `shortenStripeId`, Stripe plan stubs, health `stripe` alias, docs `relatedLinks`, etc. |
| `@deprecated` (removed this chapter) | Unused typography trio, `DangerZone`, `wasReportDelivered`, `COMPANY_SEO.canonicalBaseUrl`, unused `RiskMetrics` type |

## Classification summary

### Critical Technical Debt (Deferred V2)

- Widespread `as never` on Supabase writes (~90+ files)

### High Priority (Deferred V2)

- Stripe-named live fields (`stripeStatus`, `stripeConfigured`, …)
- Stripe archive invoice/diagnostics call paths
- `BillingProvider` still includes `"stripe"` for historical rows

### Medium Priority (Deferred / gradual)

- Raw `toLocale*` in some workspace UI
- Dual money helpers (`formatCurrency` vs workspace money)
- Three `ClientHealthBadge` modules (naming only)

### Low Priority / Safe To Remove (executed in Ch16)

- Unused `Checkbox` UI primitive
- Unused `BodyText` / `LabelText` / `EyebrowText` / `DangerZone`
- Unused `wasReportDelivered`
- Unused `RiskMetrics` type export
- Unused `COMPANY_SEO.canonicalBaseUrl`
- Empty `src/components/observability/`
- Broken one-off `scripts/export-transparent-logos.mjs` (undeclared `sharp`)
- Stale “Future: openai” comment in AI provider registry
- Misleading Stripe-era ops docs (billing/website/domain/staging/abuse)

### Deferred (intentionally preserved)

| Item | Reason |
|------|--------|
| `configuration.stripe` health alias | External monitor compat |
| `shortenStripeId` | Still imported by diagnostics UI |
| Stripe plan resolver stubs | Fail-closed imports still present |
| `DEV_FORCE_PLAN` | Local developer workflow |
| `verify-domain-routing.mjs` | Kept; wired as `npm run verify:domain-routing` |
| All npm runtime dependencies | Import evidence present |

### Architecture / Performance / DX / Maintainability / Docs / Testing / Build / Infrastructure

| Category | Finding |
|----------|---------|
| Architecture | Layering intact; no speculative rewrite |
| Performance | No dead memoization campaign required this chapter |
| Developer Experience | Domain routing verify script npm-wired; debt catalog updated |
| Maintainability | Fewer unused UI exports; clearer Paddle docs |
| Documentation | billing/website/domain/staging/abuse synchronized |
| Testing | Ch16 + technical-debt contracts; regression suite extended |
| Build System | No dependency removals (none unused) |
| Infrastructure | Cron/Paddle docs already Ch14-correct |

## Version 2 recommendations (do not implement now)

1. Gradual `insertRows`/`updateRows` migration starting with one low-risk domain
2. Rename diagnostics Stripe labels → Paddle with temporary aliases
3. Archive purge policy before dropping `"stripe"` from `BillingProvider`
4. Workspace-wide `toLocale*` → `formatAppDate*` pass
5. Domain-prefix the three health badge components
