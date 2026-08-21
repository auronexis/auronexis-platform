# Transactional Email System

Canonical platform sender for AUTH / ACCOUNT / BILLING_SYSTEM mail:

| Field | Value |
|-------|-------|
| From | `Auroranexis <noreply@auroranexis.com>` |
| Reply-To (welcome / account) | `support@auroranexis.com` |
| Never use for system mail | `sales@auroranexis.com` |

## Two delivery paths (do not conflate)

| Path | Who sends | Examples | Config |
|------|-----------|----------|--------|
| **Supabase Auth SMTP** | Supabase Dashboard Custom SMTP | Password reset, email change, magic link (if enabled) | Operator: SMTP host/user/password for `noreply@`, Confirm email **OFF** |
| **App `sendEmail()`** | Auroranexis provider (`EMAIL_PROVIDER=smtp` → STRATO) | Welcome after signup, report delivery, inbound lead notifications (From = noreply, To = inbox) | Vercel: `SMTP_*`, `EMAIL_FROM` |

Password reset is **not** sent by the app welcome pipeline. Welcome is **not** email verification and does not control activation.

## Categories

| Category | Purpose | Marketing opt-out |
|----------|---------|-------------------|
| `auth` | Password reset (Supabase), future password-changed / invite mail | Never blocks |
| `account` | Welcome, workspace lifecycle, important account info | Never blocks |
| `billing_system` | Important billing notices Auroranexis itself sends (not provider invoices) | Never blocks |

Marketing channels (`product_updates`, `newsletter`, `promotions`) default **off**. Recommended operator mailboxes for future marketing: `updates@` or `news@` (do not create in this release).

## Welcome email

- Trigger: successful signup provisioning (`signUp` in `src/lib/auth/actions.ts`)
- Subject: `Welcome to Auroranexis`
- CTA: **Sign in to Auroranexis** → `{NEXT_PUBLIC_APP_URL}/login` (production: `https://app.auroranexis.com/login`)
- Idempotency: `transactional_email_deliveries` unique `(user_id, template_key=welcome)`
- Failure: logged; account is **not** rolled back

## STRATO SMTP (from repo)

| Variable | Production expectation |
|----------|------------------------|
| `EMAIL_PROVIDER` | `smtp` |
| `SMTP_HOST` | `smtp.strato.de` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` (port 465 always uses implicit TLS in code) |
| `SMTP_USER` | `noreply@auroranexis.com` (operator) |
| `SMTP_PASSWORD` | Operator secret — never commit |
| `SMTP_FROM` / `EMAIL_FROM` | `Auroranexis <noreply@auroranexis.com>` |

`getTransactionalFromEmail()` forces the platform noreply sender when env From is not noreply (e.g. historical sales@).

## Supabase Auth template (operator — Reset Password)

App code cannot edit Dashboard templates. Configure:

**Subject:** Reset your Auroranexis password

**Body (HTML sketch):**

```html
<h2>Reset your password</h2>
<p>You requested a password reset for your Auroranexis account. This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

Use button/link text **Reset Password** — do not paste the raw URL as visible text. Confirm signup template may remain unused while Confirm email is OFF.

## Preferences

- Client: Profile → Notifications (`productUpdates` / `newsletter` / `promotions`, default false)
- Server: `user_email_preferences` (RLS; marketing defaults false)
- Security/account/billing_system mail cannot be disabled

## Related code

- `src/lib/email/welcome.ts` — welcome send
- `src/lib/email/transactional.ts` — claim → `sendEmail` → finalize
- `src/lib/email/preferences.ts` — marketing gates
- `src/lib/email/templates/welcome.ts` — branded HTML
- `docs/auth/password-reset.md` — reset flow + Supabase SMTP
