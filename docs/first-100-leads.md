# First 100 Leads — v1.0.1

**Target:** 100 qualified outbound leads before founding cohort is full.

## Segments (25 each)

| Segment | Ideal profile | List type |
|---------|---------------|-----------|
| Prospects | Ops/compliance lead at 10–50 person agency | `prospects` |
| Companies | Multi-practice MSP or consultancy | `companies` |
| Agencies | Digital/GRC agencies with 5+ clients | `agencies` |
| MSPs | IT MSPs adding compliance services | `msps` |
| Consultants | Independent GRC consultants | `consultants` |
| AI Agencies | AI automation shops serving regulated clients | `ai_agencies` |

## Sourcing

1. LinkedIn Sales Navigator filters (industry, headcount, geography).
2. Agency directories and MSP partner programs.
3. Inbound pilot applications (`/pilot-program`).
4. Referrals from existing network.
5. Conference attendee lists (compliance, MSP events).

## Enrichment checklist (per lead)

- [ ] Website verified
- [ ] LinkedIn profile URL
- [ ] Employee count estimate
- [ ] Location
- [ ] Industry tag
- [ ] Pain points captured
- [ ] ARR estimate
- [ ] Potential MRR
- [ ] Pain / fit / priority scores computed

## Weekly targets

| Week | New leads | Qualified | Meetings |
|------|-----------|-----------|----------|
| 1–2 | 30 | 10 | 3 |
| 3–4 | 40 | 15 | 5 |
| 5–6 | 30 | 10 | 4 |

## CRM fields

All enrichment lives on `sales_leads` — see migration `20250625100000_customer_acquisition.sql`.
