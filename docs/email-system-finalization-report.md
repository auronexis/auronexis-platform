# Auroranexis — Auth + Transactional Email Finalization Report

**Date:** 2026-08-21  
**Verdict:** **CODE FIXED — OPERATOR CONFIG REQUIRED**  
**Billing:** Untouched (Mollie / FastSpring / entitlements frozen)

Extends auth finalization (`fd5069f`: signup confirms at create, `/login?signup=success`, no fake check-email UX).

---

## Overall status

| Area | Status |
|------|--------|
| Signup without confirmation UX | Code complete |
| Welcome email (noreply, fail-safe, idempotent) | Code complete |
| Password reset security contracts | Code complete |
| App SMTP / `sendEmail` noreply path | Code complete |
| Supabase Auth SMTP + Dashboard templates | **Operator required** |
| Supabase Confirm email OFF | **Operator required** |
| Production DNS / mailbox password in Vercel | **Operator required** |
| Marketing send pipeline | Not built (foundation only) |

---

## A. Transactional sender

Canonical: **Auroranexis &lt;noreply@auroranexis.com&gt;** (`COMPANY_CONTACT.noReplyEmail`).

`getTransactionalFromEmail()` forces platform noreply when env From is not noreply.

---

## B. sales@ audit

| Usage | Classification | Action |
|-------|----------------|--------|
| `COMPANY_CONTACT.salesEmail` | Registry | Kept |
| Lead / pilot / demo / referral inbox (`getInboxEmail("sales")`) | Legitimate sales **recipient** | Kept |
| Enterprise request notify `to: SALES_EMAIL` | Legitimate sales **recipient** | Kept |
| Docs / pilot / GTM / FAQ mailto | Commercial contact | Kept |
| Auth / welcome / password reset From | Must not use sales@ | Enforced via noreply + tests |

Inbound contact forms: **From** = platform default (noreply); **To** = mapped inbox (may be sales@); **Reply-To** = visitor when safe.

---

## C. Email categories

| Category | Code | Examples |
|----------|------|----------|
| AUTH | `auth` | Password reset (Supabase), future security mail |
| ACCOUNT | `account` | Welcome after registration |
| BILLING/SYSTEM | `billing_system` | Future Auroranexis-originated billing notices (not provider invoices) |

Marketing channels are separate: `product_updates`, `newsletter`, `promotions`.

---

## D. Welcome email

- Subject: `Welcome to Auroranexis`
- From: noreply via `sendTransactionalEmail` → `sendEmail()`
- CTA: Sign in → `{NEXT_PUBLIC_APP_URL}/login`
- No tokens; failure does not roll back account; idempotent via `(user_id, welcome)` ledger

---

## E. Password reset

Unchanged secure flow: forgot → generic success → Supabase email (operator SMTP noreply) → reset → login. Enumeration-safe; rate limits preserved; redirects from `getAppUrl()`.

---

## F. App vs Supabase mail

| Mail | Sender path |
|------|-------------|
| Welcome | App `sendEmail` / STRATO |
| Password reset | **Supabase Auth SMTP** (operator) |
| Lead/enterprise inbound | App From noreply → To sales/info |

---

## G. Templates

- App welcome: `src/lib/email/templates/welcome.ts` (HTML CTA button)
- Supabase Reset Password: operator Dashboard — see `docs/email-system.md` / `docs/auth/password-reset.md`

---

## H. SMTP / STRATO (from repo)

| Setting | Value |
|---------|-------|
| Host | `smtp.strato.de` |
| Port | `465` |
| Secure | `true` (465 always TLS in code) |
| User / password | Operator — never committed |
| From | `Auroranexis <noreply@auroranexis.com>` |

---

## I. Marketing / newsletter

- No auto-subscribe at signup
- Prefer future `updates@` / `news@` (recommendation only — mailbox not created)
- No full marketing send pipeline in this release

---

## J. Email preferences

- Client Profile toggles: product updates / newsletter / promotions (default off)
- Server table `user_email_preferences` + `canSendEmailForPreferences`
- Transactional required always on — marketing opt-out cannot kill security/account mail

---

## K. Delivery architecture

Business event → `sendTransactionalEmail` (claim ledger) → `sendEmail` provider → finalize status. Reuses existing provider; **no second queue**.

---

## L. Tests

`scripts/transactional-email-system.test.mjs` covers brief items 1–18. Also updated signup / email-routing contracts. Run: `npm run test:transactional-email`.

---

## M. Billing freeze

No Mollie, FastSpring, provider routing, subscriptions, entitlements, or payment reconciliation changes.

---

## N. Operator checklist (blocking production mail readiness)

1. Supabase **Confirm email: OFF**
2. Supabase Custom SMTP: noreply@ + password (STRATO)
3. Supabase Reset Password template (CTA button, not raw URL)
4. Redirect URLs include production `/reset-password`
5. Vercel: `EMAIL_PROVIDER=smtp`, STRATO host/port/user/password, `SMTP_FROM` / `EMAIL_FROM` = noreply
6. Apply migration `20250821100000_transactional_email_system.sql`
7. Manual: signup → welcome received; forgot-password → reset from noreply

---

## O. Code artifacts

- `src/lib/email/welcome.ts`, `transactional.ts`, `preferences.ts`, `categories.ts`, `templates/welcome.ts`
- `supabase/migrations/20250821100000_transactional_email_system.sql`
- `docs/email-system.md`

---

## P. Residual risks

- Welcome skipped if ledger unique claim races or SMTP misconfigured (account still usable)
- Team invitations still return invite URL in UI (email invite send not in this scope)
- Client marketing toggles are localStorage until wired to `user_email_preferences` save action

---

## Q. Verdict

**CODE FIXED — OPERATOR CONFIG REQUIRED**

Do not claim PASS / complete production email readiness until Supabase Auth SMTP, Confirm email OFF, Vercel SMTP secrets, and migration apply are confirmed by operators.
