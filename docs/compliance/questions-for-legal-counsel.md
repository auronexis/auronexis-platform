# Questions for Legal Counsel

**Status:** `COUNSEL_REVIEW_REQUIRED`  
**Max:** 25 genuine legal questions  
**Priority:** P1 (answer before relying on public DPA/AI claims) · P2 (near-term) · OPTIONAL  
**Pack index:** [`counsel-review-index.md`](./counsel-review-index.md)

These are **not** “are we fully compliant?” prompts. Each expects a yes/no/conditional legal answer or redline.

---

## P1

1. **DPA / Art. 28:** Is the public standard DPA (`dpa-2026-08-29-v1`) adequate as German AVV terms for self-serve B2B SaaS, or must it be countersigned / replaced with a firm template?  
2. **DPA dual role:** Is the processor (workspace content) vs independent controller (accounts/billing/marketing) split clearly enough?  
3. **SCC / transfers:** May Annex IV state “SCCs where required, details on request” without publishing per-provider TIAs, or must a transfer schedule be completed before counsel sign-off?  
4. **ACTIVE transfers:** What transfer tools are required for **Vercel** and **Supabase** given typical production configurations?  
5. **DPIA:** For optional generative AI (OpenAI, human review UI), is Art. 35 DPIA mandatory, recommended, or not required?  
6. **RoPA:** What minimum content must be added to convert `ropa-processing-inventory.md` into a formal Art. 30 record for a sole proprietorship?  
7. **Art. 50:** Are UI labels “AI-assisted” / “AI-generated · Verify before use” sufficient transparency for authenticated generative surfaces?  
8. **Art. 4:** Does `/docs/ai-literacy` plus disclosures meet provider literacy expectations for this company scale, or are internal training records required?  
9. **Subprocessors / Mollie:** Is listing Mollie as `PSP_INDEPENDENT` (not MoR) correct, and is it properly inside/outside Art. 28 “subprocessor” authorization?  
10. **Breach:** For processor-path incidents, what is the minimum content/timing of customer notification vs Auroranexis authority notification?

## P2

11. **Art. 22:** Does any current scoring/automation feature risk “solely automated decisions with legal/similarly significant effects,” and what customer contractual limits are advised?  
12. **Cookie / TTDSG–TDDDG:** Is Sentry (if enabled) correctly treated under legitimate interest vs consent, given scrubbing and optional config?  
13. **Analytics:** Any of GA4 / Clarity / PostHog / Plausible that counsel recommends **not** enabling for a DE B2B marketing site?  
14. **Retention:** Is simulation-only deletion compatible with DPA delete/return (§16) if operator-assisted processes exist?  
15. **Statutory retention:** Which DE periods must be cited for sales invoices / e-invoice archive exclusions from erasure?  
16. **CODE_SUPPORTED providers:** May Postmark/Mailgun/SES/Anthropic/Azure appear on the public list before production use?  
17. **Subprocessor notice:** Is “reasonable advance notice” via admin message and/or public list update enough for general authorization?  
18. **Marketing consent:** Is unchecked-default newsletter + separate contact/pilot marketing opt-in sufficient for DE B2B soft-opt-in rules?  
19. **B2B framing:** Is § 14 BGB entrepreneur-only framing adequate across Privacy/Terms/checkout narratives?  
20. **Claims:** Does DPA/Security “SCCs where required” or “tokens stored encrypted” create overclaim risk requiring rewrite?

## OPTIONAL

21. **Enterprise addenda:** When should customers be steered from the standard DPA to a negotiated AVV?  
22. **Audit rights:** Are multi-tenant audit limitations in DPA §15 acceptable to typical DE enterprise procurement?  
23. **AI customer deployer duties:** What contractual clauses should push human oversight / prohibited-use limits to customers?  
24. **DPO / representative:** Is a DPO or EU representative required or advisable at current scale?  
25. **Supervisory authority:** Which authority should be named in notices/RoPA contact block for this seat (BW / Germany)?

---

## How to use

- Counsel answers should be stored as a privileged memo (prefer outside public git).  
- Do **not** flip document statuses to `LEGAL_APPROVED` / `COUNSEL_APPROVED` unless a written approval exists.  
- Engineering must not implement runtime changes from this list without a separate change-controlled task.
