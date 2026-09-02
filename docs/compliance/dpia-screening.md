# DPIA screening (preparation)

**Status:** Internal screening artifact — **LEGAL_COUNSEL_CONFIRMATION_REQUIRED** for final DPIA decisions  
**Not:** external legal approval, certification, or a completed Art. 35 DPIA by itself

## Outcome taxonomy

| Code | Meaning |
|------|---------|
| `DPIA_REQUIRED` | Screening indicates Art. 35 likely applies — draft DPIA + counsel |
| `DPIA_RECOMMENDED` | Borderline / novel processing — counsel should confirm |
| `DPIA_NOT_CURRENTLY_INDICATED` | No current trigger based on known processing (revisit on change) |
| `LEGAL_COUNSEL_CONFIRMATION_REQUIRED` | Engineering cannot close — counsel must decide |

## Screening questions (evidence-based)

1. Large-scale systematic monitoring of individuals?
2. Special-category / highly sensitive data as core processing?
3. Automated decisions producing legal/similarly significant effects?
4. Innovative AI technology with unclear residual risk?
5. Systematic processing of vulnerable persons?
6. Combining datasets in ways subjects would not expect?
7. Processing preventing exercise of rights / using new tech at scale?

## Current platform screening (engineering view)

| Processing | Notes | Preliminary code |
|------------|-------|------------------|
| Multi-tenant B2B SaaS ops data | Business customer content; RBAC/RLS; no special-category core product | `DPIA_NOT_CURRENTLY_INDICATED` for baseline SaaS ops **pending counsel** → overall `LEGAL_COUNSEL_CONFIRMATION_REQUIRED` |
| Optional generative AI (prompts + ops context) | Novel-ish assistive AI; human review expected; optional enablement | `DPIA_RECOMMENDED` |
| Marketing newsletter + optional analytics cookies | Consent-gated; not large-scale sensitive monitoring | `DPIA_NOT_CURRENTLY_INDICATED` (revisit if profiling expands) |
| Billing / Mollie PSP | Payment data via PSP; statutory invoices | `DPIA_NOT_CURRENTLY_INDICATED` for MoR/PSP split **subject to counsel** |
| Error monitoring (Sentry) | Scrubbed; optional | `DPIA_NOT_CURRENTLY_INDICATED` |

## Aggregate preliminary result

**LEGAL_COUNSEL_CONFIRMATION_REQUIRED** — with **DPIA_RECOMMENDED** for generative AI features until counsel confirms whether a full Art. 35 DPIA is mandatory for the deployed AI scope.

Evidence pointers: Privacy Policy, DPA (`READY_FOR_EXTERNAL_LEGAL_REVIEW`), sub-processor inventory, AI literacy doc, analytics consent architecture, retention simulation posture.
