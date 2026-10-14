# Auroranexis — Organic Revenue Forensic Audit

**Date:** 2026-10-01  
**Mode:** READ-ONLY (report only)  
**Priority:** P0 Commercial Growth  
**Production marketing host:** https://www.auroranexis.com  
**App host (noindex by design):** https://app.auroranexis.com  
**Sources:** `PAGE_SEO` / `PUBLIC_SITEMAP_ROUTES` / `classifyRoute` / `intent-ownership.ts` / landing content registries / prior SEO docs / live HTML + sitemap probes / operator GSC snapshot  
**Out of scope:** application code changes, FINDING-003, billing/auth/RLS, deploy/push  

---

## 1. Executive Verdict

**Verdict: COMMERCIALLY UNDER-DISCOVERABLE — architecture exists, buyer discovery does not.**

Auroranexis is not an empty-site problem. Technical SEO foundations (www canonicals, private-route noindex, public sitemap filters, intent ownership clusters, solution/feature differentiation) are largely in place from prior Godmode / Phase-2 passes. Google already associates the domain with adjacent commercial concepts (managed services portfolio, portfolio profitability reporting, AI-assisted reporting) **and** with vulnerability-disclosure / reward-adjacent queries.

The commercial failure mode is clearer:

1. **~78% of organic clicks (7/9) land on `/security/vulnerability-disclosure`** — researcher / security-policy traffic, not MSP/agency buyers.
2. **Commercial impressions exist but sit deep (~position 44)** with near-zero CTR — titles/H1s and category language still under-match how buyers search.
3. **~97 indexable URLs dilute authority** across hubs, features, industries, templates, and docs before money pages earn ranking depth.
4. **No BOFU comparison / alternatives layer** exists for evaluation searches (Gainsight-class CS platforms, MSP tooling categories).
5. **Homepage and pricing pass a partial 5-second clarity test** (who/what), but fail category capture (“Operations Command Center” is brand language, not a searchable purchase category).

Organic is not “broken.” It is **optimized for coverage and trust surfaces more than for qualified B2B buyer discovery**. Remediating ~10–15 money pages + demoting non-commercial click magnets will outperform adding dozens of new URLs.

---

## 2. Current Organic Reality

| Signal (≈ last 28d) | Value | Reading |
|---------------------|------:|---------|
| Impressions | 259 | Google is testing the site; demand is tiny but not zero |
| Clicks | 9 | Effectively no commercial acquisition channel yet |
| CTR | ~3.5% | Inflated by VDP (security queries convert to clicks); commercial CTR ≈ 0 |
| Avg position | ~44 | Deep SERP; not a brand-demand problem |
| Paying customers | 0 | Organic is not producing qualified pipeline |
| Time since public launch | >1 month | Enough for early GSC learning; not enough authority for competitive categories alone |

**Dominant landing URL:** `/security/vulnerability-disclosure` — 47 impressions, 7 clicks.

**Observed commercial-adjacent queries (operator):** managed services portfolio; client and portfolio profitability reporting; ai-assisted reporting; process operation command center; ai powered reporting service.

**Observed noise / off-ICP queries:** super receptionist integrations; robotic process automation agency; vulnerability disclosure / bug bounty / reward variants.

**Prior remediation context:** `docs/seo-godmode-remediation-2026-09.md` and `docs/seo-phase-2-organic-authority-master-pass.md` already aligned reporting ownership to `/solutions/ai-reporting` and mapped clusters A–E. Those fixes were directionally correct; **they have not yet produced commercial clicks** because positions remain deep and non-commercial URLs still harvest the click share.

---

## 3. Commercial Traffic Diagnosis

### Root causes (ranked)

| # | Cause | Evidence | Impact |
|---|--------|----------|--------|
| 1 | Non-commercial URL dominates clicks | VDP ≈ 78% of clicks | Pipeline starvation |
| 2 | Commercial queries map to weak / mid SERP positions | Avg ~44; impressions without clicks | No CTR learning loop |
| 3 | Brand category ≠ buyer category | “Operations Command Center” vs MSP/CS/reporting software | Low query→page fit |
| 4 | Authority spread across ~97 URLs | Sitemap unique count 97 | Money pages underlinked/underweighted |
| 5 | Missing BOFU evaluation content | Zero vs/alternatives pages | No late-funnel organic |
| 6 | Footer promotes VDP inside **Product** | `FOOTER_SECTIONS.product` includes Vulnerability Disclosure | Internal authority to wrong URL |
| 7 | Accidental relevance queries | RPA / receptionist | Impression waste, brand confusion |
| 8 | Partial live vs repo drift on legacy aliases | `/documentation` live 404; `/features/integrations` live 200 (stale) while repo intends redirects | Crawl/equity confusion risk |

### What is *not* the primary problem

- Missing thousands of pages  
- Complete technical indexation failure (robots/sitemap/www largely correct)  
- Lack of product truth (capabilities and EUR pricing are real)  
- Need for mass programmatic SEO  

### Commercial diagnosis in one line

Google can find Auroranexis; **buyers cannot yet use Google to find a purchase-ready reason to choose Auroranexis**, while security researchers can find the disclosure policy easily.

---

## 4. Public Route Inventory

### Indexation policy (code truth)

| Mechanism | Path | Behavior |
|-----------|------|----------|
| Category gate | `src/lib/seo/route-catalog.ts` → `classifyRoute` / `isIndexablePublicRoute` | Only `public_website` indexable |
| Private prefixes | `src/lib/seo/private-routes.ts` | Dashboard/portal/API/settings/auth prefixes excluded |
| Auth noindex | `NOINDEX_ROUTES` | `/login` `/signup` `/forgot-password` `/reset-password` |
| Sitemap builder | `src/lib/seo/sitemap.ts` + `PUBLIC_SITEMAP_ROUTES` | Filters private + noindex + non-public |
| Metadata | `createPageMetadataForPath` + `PAGE_SEO` | Canonical → `https://www.auroranexis.com{path}` |
| Live sitemap | probed 2026-10-01 | **97** `<loc>` URLs, www-only |

**Legacy losers (not in sitemap):** `/documentation` (repo: `permanentRedirect` → `/docs`; **live HEAD observed 404**), `/features/integrations` (repo: redirect → `/integrations`; **live HEAD observed 200 prerender/cache**). Treat as production drift — do not re-add to sitemap.

### Inventory summary by class

| Class | Count | Classification | Commercial intent |
|-------|------:|----------------|-------------------|
| Marketing hubs + utility | 22 | MONEY / FEATURE hub / UTILITY / SECURITY | Mixed |
| Legal | 9 | LEGAL | None |
| Features | 14 | FEATURE PAGE | Mid |
| Use cases | 9 | USE CASE | High (ICP) |
| Industries | 9 | INDUSTRY | Low–mid |
| Solutions | 6 | SOLUTION / MONEY | High |
| Templates | 5 | INFORMATIONAL lead magnet | Mid |
| Docs hub + release notes + articles | 24 | INFORMATIONAL / UTILITY | Low–mid enablement |
| **Sitemap unique** | **97** | — | — |

Auth routes exist in `PAGE_SEO` but are **noindex** and **not** in sitemap.

### Field definitions used below

- **Canonical:** www + path (all public pages via metadata builder)  
- **Robots:** index,follow unless private/noindex/preview  
- **Sitemap:** Yes if listed in live 97-URL set  
- **Structured data:** Hub/home/pricing graphs; solution/feature FAQ/Breadcrumb/Service or DefinedTerm per prior SEO passes  
- **Internal links:** qualitative (nav/footer/relatedLinks); exact edge counts not instrumented in this read-only pass  

### 4.A Money / decision hubs

| URL | Type | Title (`PAGE_SEO` / content) | Meta (abbrev.) | H1 (visible) | Sitemap | Persona | Intent | Commercial | Depth | Cannibalization | Class |
|-----|------|------------------------------|----------------|--------------|:-------:|---------|--------|------------|-------|-----------------|-------|
| `/` | Hub | Operations Command Center for AI Agencies & MSPs | B2B ops for AI agencies & MSPs… | Monitor clients. Detect risks. Document value. | Y | MSP/agency | Platform awareness | High | Deep | Brand vs category | MONEY |
| `/pricing` | Decision | B2B SaaS Pricing for Agency Operations | EUR Professional/Business/Enterprise… | Professional, Business, and Enterprise | Y | Buyers | Pricing | Critical | Medium | vs enterprise | MONEY |
| `/enterprise` | Decision | Enterprise Client Operations for MSPs & Agencies | Security, scale, AI, support | (enterprise hero) | Y | Enterprise MSP/agency | Enterprise eval | High | Medium | vs pricing | MONEY |
| `/pilot-program` | Decision | Pilot Partner Program | Invite-only pilot | (pilot hero) | Y | Invited operators | Pilot | Mid | Thin | — | MONEY (invite) |
| `/contact` | Utility | Contact … Sales, Support, and Security | Sales/support/security | (contact hero) | Y | All | Contact | Mid | Thin | vs support | UTILITY |
| `/signup` | Auth | Sign up | Create workspace… | — | N (noindex) | Buyers | Convert | Critical | — | — | OTHER |

**Primary CTAs:** Home/pricing → Get started `/signup`; enterprise/pilot → sales/contact patterns.

### 4.B Solution money pages (outcome owners)

| URL | Title / H1 | Meta intent | CTA pattern | Persona | Intent | Commercial | Overlap |
|-----|------------|-------------|-------------|---------|--------|------------|---------|
| `/solutions/customer-health-score` | Customer health score for agency portfolios | CS/health scoring MSPs/agencies | Trial/sales via landing CTAs | CS / account | Health score software | High | vs `/features/health-monitoring`, CS feature |
| `/solutions/risk-management` | Operational risk management for client delivery | Risk registers for agencies | Same | Ops | Client risk mgmt | High | vs risk-intelligence feature |
| `/solutions/incident-management` | Client portfolio incident response with SLA tracking | Incidents + SLA | Same | Delivery | Incident + SLA | High | vs incidents feature + SLA solution |
| `/solutions/sla-management` | SLA management for multi-client agencies | SLA policy/monitoring | Same | Service mgr | SLA software | High | vs incidents solution |
| `/solutions/executive-dashboard` | Executive dashboard for agency operations | Portfolio exec view | Same | COO | Portfolio dashboard | High | vs executive-dashboards feature |
| `/solutions/ai-reporting` | Automated client reporting for agencies and MSPs | Templates, schedules, PDF, portal, optional AI | Same | Account teams | Client reporting | **Critical** | vs reports + AI executive reports features |

All solutions: sitemap **Yes**, class **SOLUTION / MONEY**, content depth **Deep** (problem/audience/how/FAQ).

### 4.C Feature pages (supporting)

| URL | Title | Role | Commercial | Overlap cluster |
|-----|-------|------|------------|-----------------|
| `/features/health-monitoring` | Client health monitoring across your portfolio | How / feature | Mid | Health |
| `/features/customer-success` | Customer success tools for agency portfolios | CS toolkit | Mid–High | Health / CS |
| `/features/risk-intelligence` | Risk intelligence for client delivery | How | Mid | Risk |
| `/features/incidents` | Incident management with SLA awareness | How | Mid | Incidents/SLA |
| `/features/monitoring` | Portfolio monitoring for multi-client teams | How | Mid | Portfolio / automation |
| `/features/automation` | Automation software for agency operations workflows | Primary for automation cluster | High | Automation agencies |
| `/features/profitability` | Client and portfolio profitability reporting | **Primary** for profitability GSC query | High | Exec dashboards |
| `/features/reports` | Report templates, schedules, and publication workflows | Supporting workflow | Mid | AI reporting |
| `/features/ai-executive-reports` | AI-assisted executive reports… | AI briefing supporting | Mid | AI reporting |
| `/features/executive-dashboards` | Portfolio KPI dashboards… | Supporting | Mid | Exec dashboard solution |
| `/features/client-portal` | Client portal for transparent delivery | Primary portal | High | Enterprise |
| `/features/knowledge-base` | Knowledge Hub for delivery teams | Enablement | Low | — |
| `/features/activity-timeline` | Activity timeline for operational audit trails | Audit | Low–Mid | Compliance |
| `/features/ai-copilot` | AI Copilot for operational intelligence | Assist | Mid | AI reporting |

Hub `/features`: FEATURE hub. Class: **FEATURE PAGE**. Sitemap Yes.

### 4.D Use-case (ICP) pages

| URL | Title | ICP | Commercial | Notes |
|-----|-------|-----|------------|-------|
| `/use-cases/msps` | Portfolio operations built for MSPs | **Primary ICP** | Critical | Best MSP persona URL |
| `/use-cases/it-service-providers` | Operational command center for IT service providers | IT SP | High | Near-MSP overlap |
| `/use-cases/automation-agencies` | Operations for automation and integration agencies | Automation agencies | High | Automation cluster support |
| `/use-cases/marketing-agencies` | Client operations for marketing agencies | Marketing | Mid | vs marketing industry |
| `/use-cases/digital-agencies` | Operations platform for digital agencies | Digital | Mid | vs marketing |
| `/use-cases/software-agencies` | Client operations for software development agencies | Software agencies | Mid | — |
| `/use-cases/consultancies` | Delivery operations for consultancies | Consulting | Mid | vs consulting industry |
| `/use-cases/cybersecurity-companies` | Client delivery for cybersecurity firms | Cyber | Mid | vs cyber industry |
| `/use-cases/enterprise-teams` | Enterprise client operations at scale | Enterprise | Mid | vs `/enterprise` |

### 4.E Industry pages

Nine verticals (`/industries/{marketing,it,cybersecurity,consulting,healthcare,finance,legal,manufacturing,technology}`). Class **INDUSTRY**. Commercial **Low–Mid**. Intent overlaps heavily with use-cases (already repositioned in Phase 2). Keep as governance/sector framing; do not expand.

### 4.F Templates + resources

| URL | Class | Commercial | Role |
|-----|-------|------------|------|
| `/templates` + 5 template URLs | INFORMATIONAL | Mid | Lead magnets / frameworks |
| `/resources` | INFORMATIONAL hub | Mid | Pillar hub (`resource-pillars.ts`) |
| `/faq` | UTILITY | Mid | Buyer FAQ |

### 4.G Security / trust / legal / utility

| URL | Class | Commercial | Index? | Notes |
|-----|-------|------------|--------|-------|
| `/security` | SECURITY trust | Mid (procurement) | Y | Trust money-adjacent |
| `/security/vulnerability-disclosure` | SECURITY | **None (researcher)** | Y | **Click magnet** |
| `/compliance` | SECURITY/gov | Low–Mid | Y | — |
| `/security-policy` | LEGAL/SECURITY | None | Y | Overlaps VDP thematically |
| Legal set (privacy, terms, cookies, imprint, DPA, subprocessors, AUP, refund) | LEGAL | None | Y | Required |
| `/status` `/help` `/support` `/careers` `/about` `/integrations` | UTILITY / OTHER | Low–Mid | Y | Integrations is commercial-adjacent but thin vs product truth |

### 4.H Docs (enablement)

`/docs`, `/docs/release-notes`, and 22 doc slugs (`getting-started`, `clients`, `reports`, `risks`, `incidents`, `monitoring`, `sla`, `automation`, `integrations`, `client-portal`, `knowledge`, `profitability`, `customer-success`, `activity`, `billing`, `security`, `api`, `enterprise`, `compliance`, `white-label`, `predictive`, `ai-literacy`). Class **INFORMATIONAL**. Prefer as supporting links from money pages; do not SEO-optimize as acquisition primaries.

### Inventory classification rollup

| Keep as MONEY focus | Demote / supporting | Legal/security keep | Do not expand |
|---------------------|---------------------|---------------------|---------------|
| `/`, `/pricing`, `/enterprise`, 6 solutions, `/use-cases/msps`, `/use-cases/automation-agencies`, `/features/profitability`, `/features/client-portal`, `/features/automation`, `/security` | Other features, most industries, templates, docs, resources | All legal + VDP (indexed) | City/competitor spam, mass blog |

---

## 5. Search Intent Coverage

Legend: **EXISTING STRONG TARGET** / **EXISTING WEAK TARGET** / **CANNIBALIZED** / **NO TARGET**

| Concept | Status | Primary URL | Notes |
|---------|--------|-------------|-------|
| client health monitoring | EXISTING WEAK TARGET | `/features/health-monitoring` | Solution should own outcome |
| client health monitoring software | EXISTING WEAK TARGET | `/solutions/customer-health-score` | Title is “score” not “software” |
| customer health score | EXISTING STRONG TARGET | `/solutions/customer-health-score` | Best aligned |
| customer health score software | EXISTING WEAK TARGET | same | Add software/category phrasing in title/meta only (report proposal) |
| client risk management | EXISTING WEAK TARGET | `/solutions/risk-management` | — |
| client risk management software | EXISTING WEAK TARGET | same | — |
| SLA monitoring | EXISTING WEAK TARGET | `/solutions/sla-management` | Title says “management” not monitoring |
| SLA monitoring software | EXISTING WEAK TARGET | same | — |
| client portfolio management | CANNIBALIZED | `/`, `/solutions/executive-dashboard`, `/features/monitoring`, MSP use-case | Split authority |
| client portfolio management software | NO TARGET | — | No dedicated software-category page |
| MSP client management | EXISTING WEAK TARGET | `/use-cases/msps` | Persona page, not category |
| MSP management software | EXISTING WEAK TARGET | `/use-cases/msps` | Needs sharper category title |
| MSP customer management | EXISTING WEAK TARGET | `/use-cases/msps` | — |
| agency client management | CANNIBALIZED | multiple agency use-cases + home | — |
| agency reporting software | EXISTING WEAK TARGET | `/solutions/ai-reporting` | Strong ownership; weak SERP depth |
| client reporting software | EXISTING WEAK TARGET | `/solutions/ai-reporting` | GSC prior: automated client reporting |
| customer success software for agencies | EXISTING WEAK TARGET | `/features/customer-success` | Not solution-tier |
| customer success software for MSPs | EXISTING WEAK TARGET | `/features/customer-success` + MSP use-case | Split |
| client operations software | EXISTING WEAK TARGET | `/` + `/features` | Brand language weak |
| service delivery management software | NO TARGET | — | No explicit SDM category page |

**GSC-observed extras**

| Query | Status | Map |
|-------|--------|-----|
| managed services portfolio | EXISTING WEAK TARGET | `/use-cases/msps` |
| client and portfolio profitability reporting | EXISTING STRONG TARGET (copy) / WEAK (rank) | `/features/profitability` |
| ai-assisted reporting | CANNIBALIZED risk | `/solutions/ai-reporting` vs `/features/ai-executive-reports` |
| process operation command center | EXISTING WEAK TARGET | `/` (brand phrase) |
| ai powered reporting service | EXISTING WEAK TARGET | `/solutions/ai-reporting` |
| super receptionist integrations | NO TARGET (reject) | Accidental — do not create |
| RPA agency | EXISTING WEAK / reject doorway | `/use-cases/automation-agencies` only if natural; no RPA spam |
| vulnerability disclosure reward / bug bounty | ACCIDENTAL on VDP | Keep policy; do not chase reward SERPs |

Intent ownership source of truth remains `src/lib/seo/intent-ownership.ts` (16 clusters). Architecture is mapped; **SERP strength is not**.

---

## 6. GSC Signal Interpretation

### Why these associations exist

1. **VDP / reward queries:** Exact-match title “Vulnerability Disclosure Policy,” security.txt, footer product link, and body language about disclosure/research. Even though copy states **no public bounty**, researchers searching “disclosure reward / bug bounty” still click policy pages. **SECURITY/researcher traffic.**

2. **managed services portfolio:** `/use-cases/msps` meta/body (“managed services portfolio”) + MSP positioning on home. **HIGH-POTENTIAL commercial** — strengthen MSP money page rather than new URL.

3. **client and portfolio profitability reporting:** Near-exact title on `/features/profitability`. **GOOD emerging relevance** — improve rank/CTR, do not fork a second URL.

4. **ai-assisted reporting / ai powered reporting service:** Historical AI framing + solution/feature mesh. Godmode repositioned solution to “automated client reporting”; AI phrasing still lives on `/features/ai-executive-reports`. **GOOD emerging** with **cannibalization risk**.

5. **process operation command center:** Brand “Operations Command Center” variant. **ACCIDENTAL / brand-adjacent** — useful for branded recall, weak for purchase intent.

6. **super receptionist integrations / RPA agency:** Weak topical bleed from “integrations” / “automation agencies.” **IRRELEVANT** — do not reinforce.

### Query → likely landing map

| Query | Likely / intended landing | Action |
|-------|---------------------------|--------|
| vulnerability disclosure (+ reward variants) | `/security/vulnerability-disclosure` | Keep indexed; demote links; ignore reward SEO |
| managed services portfolio | `/use-cases/msps` | IMPROVE title/H1/CTR + internal links |
| client and portfolio profitability reporting | `/features/profitability` | IMPROVE depth + links from home/MSP/pricing |
| ai-assisted / ai powered reporting | `/solutions/ai-reporting` (primary), AI feature supporting | KEEP ownership; tighten supporting titles |
| process operation command center | `/` | Optional brand clarification; not P0 |
| receptionist / RPA | none | Suppress; no new pages |

**Rule confirmed:** strengthen existing owners; do not create parallel URLs for queries that already have a path.

---

## 7. Security Disclosure Analysis

### Page audited

`/security/vulnerability-disclosure`

| Factor | Finding |
|--------|---------|
| Why disproportionate visibility | Exact policy title; high-intent niche SERPs; low competition vs commercial SaaS SERPs; early site authority concentrates where Google finds clear matches |
| Internal links | Linked from **Product footer** (`FOOTER_SECTIONS.product`), security overview, security policy, legal copy — **over-promoted for a utility policy** |
| Metadata | Title “Vulnerability Disclosure Policy”; description is process-focused — **does not promise rewards** (good) |
| Body | Explicit: “We do not offer a public bug bounty or monetary reward program at this time.” |
| Structured data | Marketing page pattern; not AggregateRating; no bounty schema |
| Sitemap | Included (priority default ~0.7) — optional for discovery; security.txt is the operational discovery path |
| security.txt | Present at `/.well-known/security.txt` — correct for researchers |

### Recommendation

**KEEP INDEXED**

**Justification:**

1. Coordinated vulnerability disclosure must remain publicly discoverable for good-faith research and customer trust.  
2. Indexing aligns with `security.txt` and procurement due-diligence expectations.  
3. Copy already disclaims bounty/rewards — SEO is not falsely advertising payments.  
4. Noindex would reduce legitimate researcher reach and could look like security opacity — **do not trade security posture for CTR cosmetics**.  
5. Commercial fix is **demote, don’t delete**: remove from Product footer; keep under Security/Legal; optionally lower sitemap priority; ensure `/security` remains the trust money page for buyers.

**Do not:** optimize titles for “bug bounty reward,” add reward schema, or bury the reporting email.

**Do (report-only recommendations):** move footer link out of Product; add buyer-facing trust CTAs on `/security` toward pricing/demo, not toward VDP as a primary CTA.

---

## 8. Cannibalization

| Cluster | Competing URLs | Recommendation |
|---------|----------------|----------------|
| Automated / AI client reporting | `/solutions/ai-reporting`, `/features/reports`, `/features/ai-executive-reports`, `/templates/executive-report`, `/docs/reports` | **KEEP** solution primary; **REPOSITION** AI feature as briefings-only; reports feature = workflow; template/docs support |
| Client health / CS | `/solutions/customer-health-score`, `/features/health-monitoring`, `/features/customer-success`, template, docs | **KEEP** solution primary; features supporting; avoid identical H1s |
| Incidents + SLA | `/solutions/incident-management`, `/solutions/sla-management`, `/features/incidents`, templates | **KEEP** both solutions (distinct intents: response vs policy); feature supporting |
| Risk | `/solutions/risk-management`, `/features/risk-intelligence`, template | **KEEP** solution; feature supporting |
| Executive / portfolio dashboard | `/solutions/executive-dashboard`, `/features/executive-dashboards`, `/features/monitoring` | **KEEP** solution for “executive dashboard”; feature = KPI dashboards; monitoring = telemetry |
| MSP / IT portfolio | `/use-cases/msps`, `/use-cases/it-service-providers`, `/industries/it`, home | **KEEP** MSP persona primary; **REPOSITION** IT use-case/industry as sector support |
| Agency personas | marketing / digital / software use-cases + marketing industry | **KEEP** marketing agencies primary for marketing ICP; digital/software **REPOSITION** sharper niches or accept thin overlap |
| Automation | `/features/automation`, `/use-cases/automation-agencies`, monitoring, home | **KEEP** feature as software primary; use-case persona |
| Profitability | `/features/profitability`, exec dashboards, docs | **KEEP** feature primary (no solution twin) |
| Integrations | `/integrations` vs live `/features/integrations` (stale) vs `/docs/integrations` | **REDIRECT**/fix live alias; **KEEP** `/integrations` canonical; docs support |
| Docs dual entry | `/docs` vs `/documentation` | **REDIRECT** (intended); live 404 needs operator deploy verification — **MERGE** equity to `/docs` |
| Security trust | `/security`, `/security-policy`, VDP, `/docs/security` | **KEEP** `/security` buyer trust; policy/VDP utility; docs enablement |
| Help vs docs vs support | `/help`, `/support`, `/docs` | **KEEP** differentiated titles (already); watch thin overlap |

**No mass MERGE of solution↔feature pairs** — ownership model is sound; execution (titles, links, live redirects) is the gap.

---

## 9. Internal Link Authority

### Current graph (qualitative)

| Source | Links to commercial money? | Links to VDP? |
|--------|----------------------------|---------------|
| Primary nav (`MARKETING_NAV`) | Features, Solutions, Use cases, Industries, Enterprise, Pricing, Security, Docs — **good breadth, weak depth to specific money URLs** | No direct |
| Product footer | Many hubs + **Vulnerability Disclosure** + Compliance + Support… | **Yes — problem** |
| Homepage body | Feature cards + what-is links (reporting, MSP, profitability, etc. per Godmode) | Indirect via security |
| Solution `relatedLinks` | Mesh among solutions/features/templates | Rarely VDP |
| Resource pillars | Point to solutions/use-cases/features | No |
| Docs | Cross-links to product | Security docs may cite disclosure |

### Authority problems

1. **Nav stops at hubs** — `/solutions` and `/use-cases` get equity; money URLs rely on hub crawl depth.  
2. **VDP sits in Product footer** — same tier as Pricing/Features.  
3. **Profitability / MSP / reporting** need reciprocal links from pricing, enterprise, and homepage above the fold.  
4. **Industries** consume crawl/attention without returning proportional commercial value.  
5. Orphan risk: some templates/docs are only weakly linked from pillars.

### Internal-link priority map (implement later)

| Priority | From | To | Anchor style |
|----------|------|----|--------------|
| P0 | `/`, `/pricing`, `/enterprise` | `/use-cases/msps` | “MSP portfolio operations” |
| P0 | `/`, `/features`, MSP page | `/solutions/ai-reporting` | “automated client reporting” |
| P0 | `/`, MSP, pricing | `/features/profitability` | “portfolio profitability reporting” |
| P0 | Home feature grid | `/solutions/customer-health-score` | “customer health scoring” |
| P0 | Footer Product | **Remove** VDP; keep Pricing, Solutions, Use cases, Security overview | — |
| P1 | Each solution | Sibling solutions + one ICP use-case + pricing | Descriptive |
| P1 | `/security` | Pricing / contact (buyer path); VDP secondary | Trust → commercial |
| P2 | Resources pillars | Already OK — tighten anchors | — |
| P3 | Industry pages | Pair use-case only | Avoid new spokes |

---

## 10. Metadata / CTR Problems

### Systemic issues

- Titles often describe **capabilities** but omit **software category** and **ICP** in the first 40 characters.  
- Pricing title “B2B SaaS Pricing for Agency Operations” is generic — weak SERP differentiation.  
- Home title leads with brand metaphor (“Operations Command Center”) before searchable outcomes.  
- Several feature/solution pairs still feel similar in SERP snippets (reporting, health, incidents).  
- VDP title is *excellent* for security SERPs (hence the click steal).

### Proposed replacements (REPORT ONLY — do not implement here)

| URL | Current title → Proposed title | Current meta → Proposed meta |
|-----|--------------------------------|------------------------------|
| `/` | Operations Command Center… → **MSP & Agency Client Operations Software \| Auroranexis** | Keep capability list but lead with “client health, SLA, incidents, and reporting for multi-client MSPs and agencies.” |
| `/pricing` | B2B SaaS Pricing… → **MSP & Agency Operations Pricing (EUR) \| Auroranexis** | “Professional from €179/mo, Business €599/mo, Enterprise €1,799+/mo — client operations platform for MSPs and agencies. Tax at checkout.” |
| `/use-cases/msps` | Portfolio operations built for MSPs → **MSP Client Portfolio Management Software \| Auroranexis** | Lead with health, SLA, incidents, reporting, portal for managed services portfolios. |
| `/solutions/ai-reporting` | Automated client reporting… → **Automated Client Reporting Software for MSPs & Agencies** | Keep workflow truth (templates, schedules, PDF, portal, human review). |
| `/features/profitability` | (already strong) → **Client & Portfolio Profitability Reporting for Agencies \| Auroranexis** | Keep “not accounting system” differentiator. |
| `/solutions/customer-health-score` | …agency portfolios → **Customer Health Score Software for Agencies & MSPs** | Keep signals/thresholds/portfolio visibility. |
| `/solutions/sla-management` | SLA management… → **SLA Monitoring Software for Multi-Client Agencies** | Breach visibility + proof language. |
| `/features/automation` | Automation software… → **Agency Operations Automation Software \| Auroranexis** | Emphasize ops workflows, not RPA/receptionist. |
| `/enterprise` | Enterprise Client Operations… → **Enterprise MSP & Agency Operations Platform** | Security, RBAC, scale, support. |
| `/security` | Platform Security… → **Security & Trust for Agency Operations Software** | Encryption, RBAC, disclosure link secondary. |
| `/security/vulnerability-disclosure` | **Keep** (do not “commercialize”) | Optionally clarify “no bug bounty” in meta if reward queries persist — without harming reporting UX. |

Avoid exact-match spam across every page; one primary phrase per URL.

---

## 11. Conversion Problems

### 5-second clarity test (qualified MSP/agency operator)

| Question | Home `/` | Pricing | MSP use-case | AI reporting solution |
|----------|----------|---------|--------------|------------------------|
| What is Auroranexis? | Partial — “Operations Command Center” needs translation | Plans clear; product category soft | Stronger MSP framing | Strong outcome framing |
| Who is it for? | Yes (agencies & MSPs) | Agencies | Explicit MSPs | Agencies & MSPs |
| What problem? | Yes (monitor, risks, document value) | Weak (plan compare) | Yes | Yes |
| Why care? | Partial — stats are product counts, not outcomes | Price visible | Benefits present | Benefits present |
| What next? | Get started + Docs (Docs dilutes) | Get started / Sign in | Landing CTAs | Landing CTAs |

### Conversion forensic findings

| Gap | Severity | Notes |
|-----|----------|-------|
| Category ambiguity | P0 | Buyers search CS / MSP / reporting software; site sells “command center” |
| Proof | P0 | Testimonials are “representative priorities,” not named customers — honest but weak for BOFU |
| Screenshots / product demo | P1 | Hero is claim-led; limited product demonstration for SEO landers |
| G2/Capterra | P2 | No third-party review presence observed in marketing SEO layer |
| Pricing visibility from ICP pages | P1 | ICP pages must push pricing/signup harder than docs |
| Trust path | P1 | Security page should convert procurement to contact/pricing, not only disclosure |
| Signup friction | Observation | Auth noindex correct; conversion depends on paid/organic landing clarity first |
| Pilot invite-only | Observation | Correct honesty; don’t SEO pilot as open acquisition |

**SEO traffic without conversion clarity** will not fix zero customers even if rankings improve. Metadata + H1 + above-the-fold ICP language are joint SEO/CRO work.

---

## 12. Technical SEO

### Recertification checklist

| Check | Status | Evidence |
|-------|--------|----------|
| www canonical | PASS | `PUBLIC_CANONICAL_ORIGIN`; live home canonical `https://www.auroranexis.com` |
| robots.txt | PASS | Allows `/`; disallows private + auth; Host www; Sitemap declared |
| Sitemap public-only | PASS | 97 www URLs; no `/documentation` or `/features/integrations` |
| Dashboard/API noindex/disallow | PASS | `private-routes` + robots |
| Auth noindex | PASS | `NOINDEX_ROUTES` |
| `/integrations` canonical | PASS (intent) | In sitemap; live 200 |
| `/docs` canonical | PASS | In sitemap; marketing route points to `/docs` |
| Legacy `/documentation` | **FAIL live** | Repo redirect page; **live HEAD 404** — equity not consolidating via 301/308 |
| Legacy `/features/integrations` | **FAIL live** | Repo redirect; **live 200 prerender (~24d Age)** — duplicate risk vs `/integrations` |
| Metadata uniqueness | PASS WITH OBSERVATIONS | PAGE_SEO + registries; some thematic similarity remains |
| Structured data hygiene | PASS | No fake AggregateRating; SoftwareApplication on home/pricing graphs |
| hreflang | PASS (en + x-default self) | Not multi-locale — correct for now |
| OpenGraph | PASS | Shared branding asset pattern |
| Crawlability | PASS WITH OBSERVATIONS | Fix live alias drift |
| Indexability policy code | PASS | `isIndexablePublicRoute` |

### Technical P0 for operators (no code in this audit)

1. Verify production deploy of `/documentation` → `/docs` **permanent redirect** (308/301), not soft 404.  
2. Purge/rebuild so `/features/integrations` **redirects** to `/integrations` (stop 200 HTML duplicate).  
3. Confirm sitemap remains free of losers after deploy.  
4. Do **not** touch FINDING-003 as part of SEO work.

---

## 13. ICP Coverage

| ICP | Coverage | Best URL | Gap |
|-----|----------|----------|-----|
| MSPs | Strong page, weak SERP | `/use-cases/msps` | Category title/CTR; link equity |
| IT service providers | Present | `/use-cases/it-service-providers` | Overlap with MSP — keep secondary |
| AI automation agencies | Present | `/use-cases/automation-agencies` + automation feature | Avoid RPA/receptionist drift |
| Marketing / digital agencies | Present | marketing + digital use-cases | Cannibalization between personas |
| Consultancies | Present | `/use-cases/consultancies` | Lower priority than MSP |
| Multi-client service orgs (generic) | Soft | `/` | Needs clearer “multi-client operations software” language |
| Enterprise multi-client | Present | `/enterprise`, enterprise use-case | OK |
| Procurement / security evaluators | Present | `/security`, legal, DPA | OK — separate from VDP researcher path |

**Primary bet for 30 days:** MSP + automation agency + reporting/health/profitability outcomes. Deprioritize industry sprawl.

---

## 14. Competitor / Alternative Opportunity

### Named CS platforms (Gainsight, ChurnZero, Totango, Planhat, ClientSuccess)

| Question | Answer |
|----------|--------|
| Do comparison pages exist today? | **No** |
| Is a misleading feature-parity “vs Gainsight” page acceptable? | **No** |
| Is a factual category alternative page supportable? | **Conditionally yes** |

**Supportable comparison frame (only):**

- Those products are primarily **product-led / SaaS customer success platforms** for software companies’ end-customer lifecycle.  
- Auroranexis is an **operations command center for multi-client service providers** (MSPs/agencies): client health, risk, incidents, SLA, reporting, portal, RBAC — delivery operations, not classic product CS journey analytics.  
- Honest page thesis: “Searching Gainsight/Planhat for MSP/agency portfolio delivery? Different category — here is how Auroranexis maps to multi-client service operations.”

**Do not claim:** feature parity, migration wizards you don’t have, invented win rates, or “Gainsight for MSPs” if it overstates.

### Missing BOFU assets

| Asset type | Status | Recommendation |
|------------|--------|----------------|
| Alternatives page (CS platforms for service providers) | Missing | **CREATE** one careful page (P2) |
| Versus pages (brand vs brand) | Missing | Only after alternatives page proves demand; start with 0–1 |
| Buyer guides | Thin (resources hub only) | **IMPROVE** MSP + reporting owners first; optional 1 guide |
| Solution pages | Exist (6) | **IMPROVE** not multiply |
| ICP pages | Exist | **IMPROVE** MSP/automation |
| Feature landings | Exist (14) | Tighten; don’t add |

---

## 15. Pages to Keep

- `/` platform hub  
- `/pricing`, `/enterprise`, `/contact`, `/pilot-program`  
- All 6 `/solutions/*`  
- `/use-cases/msps`, `/use-cases/automation-agencies`, `/use-cases/it-service-providers`  
- `/features/profitability`, `/features/client-portal`, `/features/automation`, `/features/health-monitoring`, `/features/customer-success`  
- `/security` (buyer trust)  
- `/integrations`, `/docs` (+ enablement docs)  
- Templates (lead magnets)  
- Full legal set  
- `/security/vulnerability-disclosure` (**indexed**)  

---

## 16. Pages to Improve

| URL | Why | Focus |
|-----|-----|-------|
| `/` | Category + CTR + CTA | Software category language; commercial CTAs over Docs |
| `/pricing` | Decision CTR | ICP + EUR in title; outcome bullets |
| `/use-cases/msps` | Highest ICP GSC adjacency | “MSP … software” title; link to reporting/profitability/health/pricing |
| `/solutions/ai-reporting` | Reporting demand | Reinforce automated client reporting; CTR |
| `/features/profitability` | Exact GSC match | Depth, examples, links from money pages |
| `/solutions/customer-health-score` | Core capability | “software” category + MSP/agency |
| `/solutions/sla-management` | SLA monitoring queries | Monitoring language |
| `/features/automation` | Ops automation | Block RPA/receptionist drift |
| `/security` | Trust → revenue | Buyer CTAs; VDP secondary |
| `/features/customer-success` | CS-for-agencies/MSPs queries | Explicit ICP in title |
| `/use-cases/automation-agencies` | Persona | Ops monitoring, not generic RPA |

---

## 17. Pages to Merge

| Pair | Action | Timing |
|------|--------|--------|
| `/documentation` → `/docs` | MERGE via permanent redirect (already coded) | **P0 operator verify live** |
| `/features/integrations` → `/integrations` | MERGE via permanent redirect (already coded) | **P0 operator verify live** |
| Digital vs marketing agency use-cases | Soft merge content roles (not necessarily 301) | P2 if GSC shows split |
| Help vs Support | Keep separate unless GSC shows duplicate queries | Watch |

No solution↔feature hard merges recommended in this cycle.

---

## 18. Pages to Remove/Redirect

| URL | Action | Reason |
|-----|--------|--------|
| `/documentation` | REDIRECT → `/docs` | Dual entry; live currently 404 |
| `/features/integrations` | REDIRECT → `/integrations` | Duplicate integrations surface |
| Legacy `/legal/*` | Remain private/disallowed | Already non-indexable |
| New city/RPA/receptionist doorways | DO NOT CREATE | Irrelevant GSC noise |

**Do not noindex VDP.**  
**Do not remove legal pages.**

---

## 19. Pages to Create

Prefer improve-first. Create only where **NO TARGET** + clear buyer value:

| Proposed URL | Intent | ICP | Funnel | Why create | Priority |
|--------------|--------|-----|--------|------------|----------|
| `/resources/msp-agency-vs-customer-success-platforms` (name flexible) | Alternatives / category education vs Gainsight-class tools | MSP/agency evaluators | BOFU | No alternatives layer; factual category contrast only | P2 |
| `/resources/client-portfolio-operations-for-msps` | Buyer guide | MSP owners | MOFU | Only if `/use-cases/msps` cannot absorb guide-depth without thinness | P3 (optional) |

**Do not create:** receptionist pages, RPA agency spam, city pages, fake integration marketplaces, bounty/reward SEO pages, dozens of vs-{competitor} stubs.

---

## 20. Final Money-Page Architecture

Fewer stronger pages. Recommended commercial IA:

| URL | Primary intent | Secondary | ICP | Funnel | Why exists | Competing page | Action | Links needed | CTA | Priority |
|-----|----------------|-----------|-----|--------|------------|----------------|--------|---------------|-----|----------|
| `/` | Multi-client ops software | Brand command center | MSP/agency | AWARE | Platform | hubs | IMPROVE | → MSP, reporting, health, pricing | Signup | P0 |
| `/pricing` | Price evaluation | Plan compare | Buyers | DECISION | Money | enterprise | IMPROVE | ← all money pages | Signup/Contact | P0 |
| `/use-cases/msps` | MSP portfolio ops / MSP software | Managed services portfolio | MSP | AWARE/CONSID | ICP #1 | IT use-case | IMPROVE | → solutions + pricing | Signup | P0 |
| `/solutions/ai-reporting` | Automated client reporting | AI-assisted reporting | Account/delivery | CONSID | Outcome | reports features | IMPROVE | ↔ profitability, MSP | Signup | P0 |
| `/features/profitability` | Portfolio profitability reporting | Margin visibility | Partners/ops | CONSID | GSC match | exec dashboards | IMPROVE | ← home, MSP, pricing | Signup | P0 |
| `/solutions/customer-health-score` | Customer health score software | Health monitoring | CS/account | CONSID | Core capability | health feature | IMPROVE | ↔ CS feature | Signup | P1 |
| `/solutions/incident-management` | Incident + SLA response | Incident mgmt | Delivery | CONSID | Core | incidents feature | KEEP/IMPROVE | ↔ SLA | Signup | P1 |
| `/solutions/sla-management` | SLA monitoring/management | Breach proof | Service mgr | CONSID | Core | incidents | KEEP/IMPROVE | ↔ reporting | Signup | P1 |
| `/solutions/risk-management` | Client delivery risk | Risk register | Ops | CONSID | Core | risk feature | KEEP | ↔ health | Signup | P2 |
| `/solutions/executive-dashboard` | Executive portfolio dashboard | KPI command | COO | CONSID | Core | KPI feature | KEEP | ↔ monitoring | Signup | P2 |
| `/features/client-portal` | Client portal | Transparency | Agencies | CONSID | Differentiator | enterprise | IMPROVE | ← solutions | Signup | P1 |
| `/features/automation` | Agency ops automation software | Workflow automation | Automation agencies | CONSID | Cluster owner | automation use-case | IMPROVE | ↔ monitoring | Signup | P1 |
| `/use-cases/automation-agencies` | Automation agency persona | Integration agencies | Automation firms | AWARE | ICP #2 | automation feature | IMPROVE | → automation, monitoring | Signup | P1 |
| `/enterprise` | Enterprise evaluation | Security/scale | Enterprise | DECISION | ACV | pricing | IMPROVE | → security, contact | Contact | P1 |
| `/security` | Trust/procurement | Compliance | Security buyers | DECISION | Trust | VDP/policy | IMPROVE | → pricing; VDP secondary | Contact | P1 |
| `/integrations` | Integrations overview | API/webhooks | Technical buyers | CONSID | Canonical | legacy feature URL | KEEP + fix redirect | → docs/api | Signup | P2 |
| Alternatives resource (new) | CS platform alternatives for MSPs/agencies | Gainsight-class eval | Evaluators | BOFU | Missing layer | none | CREATE (careful) | → MSP, health, pricing | Contact | P2 |

Everything else is **supporting, legal, or enablement** — maintain, don’t expand.

---

## 21. Top 10 Highest-Leverage Changes

1. **Demote VDP in internal linking** (remove from Product footer; keep under Security) — stops feeding non-commercial clicks with sitewide equity.  
2. **Rewrite money-page titles/metas** for `/`, `/pricing`, `/use-cases/msps`, `/solutions/ai-reporting`, `/features/profitability` toward ICP + software category (report proposals in §10).  
3. **Concentrate internal links** from home/pricing/enterprise into MSP + reporting + profitability + health.  
4. **Fix live legacy aliases** (`/documentation`, `/features/integrations`) so canonical equity lands on `/docs` and `/integrations`.  
5. **Homepage above-the-fold CRO/SEO** — say “client operations software for MSPs & agencies” before brand metaphor; primary CTA Signup, secondary Pricing (not Docs).  
6. **Deepen `/use-cases/msps`** as the MSP software page (managed services portfolio query owner).  
7. **Defend reporting ownership** — solution primary; AI feature supporting only.  
8. **Exploit profitability exact-match** — make `/features/profitability` a true money page with proof and pricing path.  
9. **Add one factual alternatives/category page** (CS platforms vs multi-client service ops) — only with honest differentiation.  
10. **Ignore vanity queries** (receptionist, RPA, bounty rewards) — no pages, no title chasing.

---

## 22. 72-Hour Plan (P0)

1. Operator: confirm/fix production redirects for `/documentation` → `/docs` and `/features/integrations` → `/integrations`; purge CDN/prerender.  
2. Prepare (but do not auto-deploy from this audit) copy deck for titles/metas on five money URLs in §10.  
3. Prepare footer IA change: VDP out of Product; Security overview remains.  
4. GSC: annotate VDP vs commercial click split; request indexing only after money URL content updates ship.  
5. Freeze scope: no new URL sprawl, no FINDING-003 work, no bounty SEO.

---

## 23. 7-Day Plan (P1)

1. Ship metadata + H1/intro improvements on `/`, `/pricing`, `/use-cases/msps`, `/solutions/ai-reporting`, `/features/profitability`.  
2. Ship internal link priority map P0 rows.  
3. Strengthen MSP page sections: health, SLA, reporting, profitability, portal, pricing CTA.  
4. Reposition `/features/ai-executive-reports` snippet to “leadership briefings” only.  
5. `/security` buyer path: procurement summary → contact/pricing; VDP link clearly labeled for researchers.  
6. Measure: GSC query filter excluding “vulnerability/disclosure/bounty/reward.”

---

## 24. 30-Day Plan (P2–P3)

### Days 8–14 (P2)

- Improve health, SLA, portal, automation money pages.  
- Draft **one** alternatives/category education page (CS platforms vs service-provider ops) with legal/product review for factual claims.  
- Reduce industry-page promotion in nav/footer emphasis (optional IA tweak).  
- Validate structured data still matches visible content after copy edits.

### Days 15–30 (P3)

- Publish alternatives page only if P2 draft clears honesty bar.  
- Optional MSP buyer-guide depth **on existing MSP URL** before creating a second guide URL.  
- Build external digital PR only around genuine product narratives (not directories spam).  
- Re-run GSC: commercial clicks share, positions for MSP/reporting/profitability, VDP share declining as % of clicks.  
- Decision gate: if commercial impressions rise but signup conversion flat → shift budget to CRO/demo proof, not more pages.

### Prioritization formula used

`commercial impact × search opportunity × implementation confidence ÷ effort`  
→ favors metadata/links/redirect fixes and MSP/reporting/profitability over new URL factories.

---

## 25. Expected Measurement Framework

| KPI | Baseline (≈28d) | 30-day target sense | Notes |
|-----|----------------:|---------------------|-------|
| Organic clicks excluding VDP/security-disclosure queries | ~2 | Directionally ↑ | Primary success metric |
| VDP share of organic clicks | ~78% | ↓ as % (absolute VDP clicks may stay) | Demotion success |
| Impressions on MSP / reporting / profitability queries | low | ↑ | Early leading indicator |
| Avg position on those commercial queries | ~40–90 band | Improve toward page 2/1 | Not vanity sitewide avg |
| CTR on money URLs | ~0 | ↑ after title tests | Need impressions first |
| Signup/start-trial from organic landing | unknown/0 | Track in analytics | CRO joint KPI |
| Index coverage of money URLs | assume indexed | Remain indexed | GSC URL inspection |
| Paying customers from organic | 0 | Lagging | Don’t expect 30-day miracle; expect **qualified discovery** |

**Do not optimize:** total impressions, VDP rankings, receptionist/RPA queries, branded vanity alone.

---

## 26. Evidence / File References

| Artifact | Path / source |
|----------|----------------|
| PAGE_SEO / static titles | `src/lib/seo/routes.ts` |
| Sitemap builder | `src/lib/seo/sitemap.ts` |
| Public route list | `src/lib/company/company-links.ts` → `PUBLIC_SITEMAP_ROUTES` |
| Route classification | `src/lib/seo/route-catalog.ts` |
| Private / noindex | `src/lib/seo/private-routes.ts` |
| Robots | `src/lib/seo/robots.ts` |
| Intent clusters | `src/lib/seo/intent-ownership.ts` |
| Solutions/templates | `src/lib/seo/landing-content.ts` |
| Features | `src/lib/seo/feature-content.ts` |
| Use cases | `src/lib/seo/audience-content.ts` |
| Industries | `src/lib/seo/industry-content.ts` |
| Resource pillars | `src/lib/seo/resource-pillars.ts` |
| Docs registry | `src/lib/docs/registry.ts` |
| VDP content | `src/lib/security/vulnerability-disclosure.ts` + page under `src/app/(marketing)/security/vulnerability-disclosure/` |
| Legacy redirects (repo) | `src/app/(marketing)/documentation/page.tsx`, `src/app/(marketing)/features/integrations/page.tsx` |
| Nav / footer | `src/lib/marketing/content.ts` (`MARKETING_NAV`), `FOOTER_SECTIONS` in `company-links.ts` |
| Prior SEO | `docs/seo-godmode-remediation-2026-09.md`, `docs/seo-phase-2-organic-authority-master-pass.md`, Chapter 8 SEO bible |
| FINDING-003 (untouched) | `docs/security/production-security-forensic-audit-2026-09.md` |
| Live probes 2026-10-01 | sitemap.xml = 97 www URLs; robots OK; home title/canonical OK; `/documentation` HEAD 404; `/features/integrations` HEAD 200 stale; VDP page live with no-bounty statement |
| Operator GSC | 259 impr / 9 clicks / pos ~44; VDP 47/7 |

---

## 27. Final Verdict

**Auroranexis’ public organic architecture is technically competent and commercially misaligned.**

The site can be crawled and partially understood, but **qualified B2B buyers are not discovering a purchase path via Google**. Present organic success is dominated by a **correctly indexed vulnerability disclosure policy** that must **remain indexed** for security reasons, while money pages sit too deep, speak brand language instead of category language, and share equity with ~97 URLs and a footer that elevates VDP into the Product graph.

**Highest-leverage path:** demote non-commercial authority, harden 8–12 money pages (MSP, reporting, profitability, health, pricing, home), fix live canonical redirects, then add at most one honest alternatives page — not a content farm.

**Certification-style label for growth readiness:**  
**NOT READY FOR ORGANIC REVENUE RELIANCE — READY FOR FOCUSED MONEY-PAGE EXECUTION.**

---

*End of forensic audit. No application code was modified. FINDING-003 was not started.*
