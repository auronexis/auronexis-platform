# Phase 33 — Enterprise Trust, Authority & Market Readiness

**Status:** Production-ready  
**Date:** July 2026  
**Scope:** Public trust surfaces, EEAT, navigation, contact channels, documentation discoverability — no auth, billing, API, or middleware changes.

## Objective

Prepare Auroranexis for professional evaluation by enterprise customers before customer acquisition — improving trustworthiness, factual accuracy, navigation consistency, and procurement-ready contact surfaces.

## Non-modified systems

- Authentication, RBAC, middleware
- Stripe, billing logic, database schema, Supabase security
- OpenAI business logic, APIs

## Audit summary

| Area | Finding | Action |
|------|---------|--------|
| Support contact channels | Future mailboxes shown without labeling | Split active/future; badge pending mailboxes |
| Documentation sitemap | Only 6 of 17 doc slugs indexed | Derive `PUBLIC_DOC_ROUTES` from `DOC_PAGE_SLUGS` |
| PAGE_SEO docs | Partial static registry | `buildDocPageSeo()` from `DOC_PAGES` |
| Footer company nav | `/help` orphaned | Added Help link |
| Pilot CTA | "Join pilot program" vs invite-only | Renamed to "Request invitation" |
| Homepage stats | "24/7" could imply human support | Clarified as portfolio visibility |
| GDPR badge | Could be misread as certification | Added explicit non-certification detail |
| Testimonials | Already representative | Added visible disclaimer |
| About page | Limited EEAT signals | Added company identity + evaluation checklist |
| Documentation page | `/documentation` vs `/docs` unclear | Clarified marketing entry vs docs hub |

## EEAT improvements

### Experience & expertise
- About page: legal entity, founder, headquarters, business type, imprint link
- Evaluation checklist: security → compliance → status → docs → pricing/contact

### Authoritativeness
- Consistent contact channel registry across `/contact` and `/support`
- Full documentation slug coverage in sitemap and PAGE_SEO
- Footer exposes support@ and sales@

### Trustworthiness
- Future contact mailboxes labeled "Mailbox pending" with routing guidance
- Testimonials explicitly marked as representative priorities
- Certification language unchanged — readiness only, no SOC 2/ISO claims
- GDPR described as workflow support, not certification

## Customer journey (verified)

```
Landing (/) → Pricing / Features / Security / Compliance
           → Documentation (/documentation) → Docs hub (/docs)
           → Help (/help) → FAQ / Support
           → Contact (/contact) or Support (/support)
           → Signup (/signup) → Dashboard
```

## Files changed

### Modified
- `src/lib/docs/registry.ts` — `DOC_PAGE_SLUGS` export
- `src/lib/company/company-links.ts` — full doc sitemap, Help in footer
- `src/lib/seo/routes.ts` — `buildDocPageSeo()`
- `src/lib/marketing/content.ts` — stats + GDPR clarity
- `src/lib/marketing/cta.ts` — pilot CTA wording
- `src/components/marketing/enterprise-contact-card.tsx` — future channel badge
- `src/components/marketing/marketing-testimonials.tsx` — disclaimer
- `src/components/layout/site-footer.tsx` — sales@ in marketing footer
- `src/app/(marketing)/support/page.tsx` — active/future channel split
- `src/app/(marketing)/about/page.tsx` — company identity + evaluation path
- `src/app/(marketing)/documentation/page.tsx` — path clarification
- `src/app/(marketing)/use-cases/page.tsx` — pilot CTA label
- `scripts/communication-contact.test.mjs` — support page assertion update
- `package.json` — `test:phase-33`

### New
- `scripts/phase-33-enterprise-trust.test.mjs`
- `docs/phase-33-enterprise-trust-authority-market-readiness.md`

## Tests

```bash
npm run test:phase-33
npm run typecheck
npm run lint
npm run build
git diff --check
```

`test:phase-33` verifies:
- Trust page metadata (about, support, help, status, FAQ, security, compliance)
- Legal pages in sitemap
- Active/future contact channel split
- Footer Help link
- Testimonial labeling
- Certification guardrails
- About EEAT content
- Documentation path clarity
- Full doc slug registry
- Pilot invite-only wording
- Status page factual posture
- Private/preview noindex

## Known limitations

1. **`/llms.txt` auth redirect** — middleware blocks unauthenticated access (middleware off-limits this phase). Public AI crawlers may not reach it without a future middleware exclusion.
2. **Future mailboxes** — displayed with pending label; operational status requires owner verification.
3. **External subdomains** (`docs.auroranexis.com`, `status.auroranexis.com`) — referenced on documentation page; live status not verified in CI.
4. **Vercel Ready/Current** — requires dashboard confirmation post-push.

## Owner checklist

- [ ] Run validation suite
- [ ] Commit and push to `main`
- [ ] Verify Vercel production deployment
- [ ] Smoke test `/about`, `/support`, `/help`, `/contact`, `/documentation`
- [ ] Confirm future mailboxes or remove from public surfaces
- [ ] Optional: resolve `/llms.txt` middleware exclusion in a future phase

## Final decision framework

| Decision | Criteria |
|----------|----------|
| **A. Enterprise market ready** | All validation passes, production deployed, smoke tests green |
| **B. Code complete — owner verification** | Code/tests pass; mailboxes, subdomains, or dashboard checks pending |
| **C. Blocked** | Confirmed factual, security, or regression issues remain |

## Accuracy policy (unchanged)

- No invented customers, testimonials, certifications, or partnerships
- Pilot Partner and Founding Customer programs remain invite-only
- Compliance = readiness posture only
