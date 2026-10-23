# Guides playbook

How new long-form guides for `/guides` are written. The weekly guide task follows this file;
people can too.

## Rules

- **Useful on its own.** A reader must be able to act on the guide without buying anything.
- **No invented proof.** No statistics, benchmarks, customers, quotes or case studies that are not
  real and sourced. Example numbers are labelled as examples, and their arithmetic is correct.
- **Product statements match the live site.** Check `/features`, `/solutions`, `/pricing` and
  `/pilot-program` before writing the "Where Auroranexis fits" section. If Auroranexis does not do
  something, say so, or leave it out.
- **No certification claims.** GDPR, SOC 2, ISO 27001, NIS2 and DORA only as readiness or
  "supports workflows".
- **Regulation is sourced.** Any legal deadline or requirement links to an official or primary
  source that was opened and read for the guide.
- **Plain English.** Short sentences, no internal jargon, no keyword stuffing. Proofread twice.
- **One guide per topic.** Do not publish a guide that substantially repeats an existing one.

## Format

Content lives in `src/lib/seo/guides-content.ts` (`GuideContent`). For every new guide:

1. Add the route to `GUIDE_ROUTES` (`src/lib/company/company-links.ts`) and the slug to
   `GUIDE_SLUGS` in `src/lib/seo/public-dynamic-slug-allowlist.ts`.
2. Add the guide object and append it to `GUIDES`.
3. `seoTitle` + " | Auroranexis" ≤ 60 characters; `description` ≤ 155 characters.
4. `published` and `updated` = today; `content-dates.ts` keeps the `/guides` date in sync (use the newest `updated`).
5. 900+ words, at least three FAQ entries, internal links to the matching feature, solution or
   template pages.
6. Checks: `node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/*.test.mjs`,
   `npx tsc --noEmit -p .`, `npx eslint .`, and a production build. All must pass before pushing.

## Backlog

Pick the first topic that is not yet in `GUIDES`. Prefer topics with Search Console impressions
when that data is available. Move a topic to "Published" when its PR is opened.

| # | Slug | Working title | Target searches |
|---|---|---|---|
| 1 | customer-health-score | Customer health score: how to build one for a service business | customer health score, client health score |
| 2 | client-churn-warning-signs | Warning signs a client is about to leave, and what to do about them | client churn warning signs, client retention agency |
| 3 | quarterly-business-review | How to run a quarterly business review with clients | quarterly business review, QBR template |
| 4 | monthly-client-report-template | What to include in a monthly client report (with an outline) | monthly client report template |
| 5 | msp-client-reporting | Client reporting for MSPs: what to show every month | MSP client reporting, MSP monthly report |
| 6 | client-deadline-tracking-accounting | Tracking deadlines across many clients for accounting and payroll firms | client deadline tracking accounting firm |
| 7 | facility-services-sla-reporting | Proving SLA performance on cleaning and facility contracts | facility management SLA reporting |
| 8 | agency-retainer-reporting | How agencies show retainer value every month | retainer client reporting, agency client retention |
| 9 | client-incident-report | How to report an incident to a client | incident report to client, client incident communication |
| 10 | property-management-owner-reporting | Owner and board reporting for property managers | property management owner report |
| 11 | client-portal-for-service-businesses | Does your service business need a client portal? | client portal software small business |
| 12 | nis2-incident-reporting-timeline | NIS2 incident reporting deadlines for IT service providers (sourced from official texts) | NIS2 incident reporting deadlines |

## Published

| Date | Slug |
|---|---|
| 2026-10-23 | automated-client-reporting |
| 2026-10-23 | client-profitability-analysis |
| 2026-10-23 | sla-reporting |
