# Launch Readiness — v0.98

**Status:** Pilot Customer Acquisition Ready  
**Score target:** Pilot acquisition readiness ≥ 95/100

## Sprint 3 deliverables

### Website (`src/app/(marketing)/`)

- `/` — full landing (hero, features, use cases, security, compliance, pricing, FAQ, pilot CTA)
- `/features`, `/use-cases`, `/pricing`, `/security`, `/compliance`, `/integrations`
- `/documentation`, `/contact`, `/pilot-program`, `/status`, `/about`, `/careers`
- `/help`, `/support`

### Legal

- `/imprint`, `/privacy`, `/terms`, `/cookies`
- `/security-policy`, `/subprocessors`, `/data-processing-agreement`, `/acceptable-use`
- Legacy `/legal/*` redirects to canonical routes

### Support

- Help menu: Documentation, Status, Support, Security, Pilot Program, Contact
- No "coming soon" placeholders

### SEO

- `src/app/robots.ts`, `src/app/sitemap.ts`
- Per-page OpenGraph/Twitter via `createMarketingMetadata`
- JSON-LD: Organization, SoftwareApplication, FAQ, Pilot Offer

### Diagnostics

- Website / Legal / Support / Pilot readiness scores
- Integrated into production readiness average

### In-app pricing

- Public marketing pricing: `/pricing`
- Workspace plan management: `/settings/plans` (formerly `/pricing` in dashboard)

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

## Version

0.98.0
