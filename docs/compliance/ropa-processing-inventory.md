# RoPA-style processing inventory (Art. 30 groundwork)

**Status:** Internal groundwork for records of processing — **not** a counsel-approved Art. 30 record  
**DPA / legal pages:** remain `READY_FOR_EXTERNAL_LEGAL_REVIEW` where marked — do not claim lawyer approval

| # | Processing activity | Purpose | Categories of data | Data subjects | Recipients / processors | Retention intent | Lawful basis (indicative) |
|---|---------------------|---------|----------------------|---------------|-------------------------|------------------|---------------------------|
| 1 | Workspace account & auth | Provide SaaS access | Account identifiers, auth metadata | Customer staff users | Supabase, Vercel | Account life + security logs | Contract Art. 6(1)(b) |
| 2 | Client operations CRM | Deliver contracted features | Client/contact/ops records | Customer end-clients (controller customers) | Supabase; optional AI | Subscription + offboarding; simulation retention rules | Processor instructions / contract |
| 3 | Billing & invoicing | Charge & account | Billing identity, invoices, tax fields | Customer org contacts | Mollie (PSP), Supabase | Statutory accounting / e-invoice archive | Contract + legal obligation |
| 4 | Transactional email | Service messages | Email, message content | Users / leads | SMTP/STRATO; optional Resend/others | Operational email logs per provider | Contract / legitimate interest (service) |
| 5 | Marketing newsletter | Product updates | Email, consent evidence | Prospects / subscribers | Sales lead store, consent_records | Until withdrawal + suppression needs | Consent Art. 6(1)(a) |
| 6 | Contact / pilot intake | Respond to inquiries | Name, email, company, message | Prospects | Sales lead store | Sales pipeline needs | Contract steps / legitimate interest; marketing only if opted in |
| 7 | Optional analytics | Product/marketing measurement | Pseudonymous events | Visitors / users | GA4, PostHog, Plausible, Clarity (if enabled) | Per provider + consent withdrawal | Consent |
| 8 | Error monitoring | Reliability | Stack traces, limited request context (scrubbed) | Indirect | Sentry (if enabled) | Provider retention | Legitimate interest (security/reliability) |
| 9 | Optional generative AI | Assist drafting/analysis | Prompts, trusted ops context | Users; may include client data if submitted | OpenAI / other configured AI | AI logs per retention rules (simulation) | Contract + customer instructions; consent where required |
| 10 | Compliance / audit | Security & accountability | Audit events, GDPR request meta | Users | Supabase | Security/compliance retention intent | Legal obligation / legitimate interest |

Update this inventory when adding processors, new AI modalities, or new marketing channels. Counsel should convert this into the formal Art. 30 record.
