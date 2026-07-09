# Password Reset

Production password reset flow for Auroranexis staff accounts (Supabase Auth email/password).

## Flow

1. User opens **Forgot password?** on `/login` → `/forgot-password`.
2. User submits email. The app calls `supabase.auth.resetPasswordForEmail()` with redirect:
   - `${NEXT_PUBLIC_APP_URL}/reset-password`
3. Supabase sends a recovery email (1-hour link expiry by default).
4. User clicks **Reset Password** in the email → lands on `/reset-password?code=…`.
5. Server exchanges the code for a recovery session (cookies).
6. User sets a new password (12+ chars, upper, lower, number) → redirect to `/login?reset=success`.

## Supabase redirect URLs

Add these to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000/reset-password` |
| Production | `https://app.auroranexis.com/reset-password` |
| Staging | `https://staging.auroranexis.com/reset-password` (if applicable) |

Also ensure **Site URL** matches the app origin (`NEXT_PUBLIC_APP_URL`).

## Production sender branding

Auth emails (password reset, signup confirmation) are sent by **Supabase Auth**, not the application Resend integration.

### Target production sender

| Field | Value |
|-------|-------|
| From | `Auroranexis <no-reply@auroranexis.com>` |
| Reply-to | `support@auroranexis.com` |

### Supabase configuration

1. **Project Settings → Auth → SMTP Settings**
   - Enable custom SMTP (Resend SMTP, Postmark, or AWS SES SMTP endpoint)
   - Sender email: `no-reply@auroranexis.com`
   - Sender name: `Auroranexis`

2. **Authentication → Email Templates**
   - Reset Password: subject `Reset your Auroranexis password`
   - Remove default Supabase footer/branding
   - CTA: `Reset Password` using `{{ .ConfirmationURL }}`

3. **DNS (required before switching)**
   - SPF record including your SMTP provider
   - DKIM records from Resend/Postmark/SES
   - DMARC policy for `auroranexis.com`

Application transactional email (report delivery, lead notifications) uses the provider abstraction in `src/lib/email/provider/`. Set `EMAIL_FROM=Auroranexis <no-reply@auroranexis.com>` in Vercel production.

## Email template (Supabase)

Configure under **Authentication → Email Templates → Reset Password**.

| Field | Recommended copy |
|-------|------------------|
| **Subject** | Reset your Auroranexis password |
| **Heading** | Reset your password |
| **Body** | You requested a password reset for your Auroranexis account. This link expires in **1 hour**. If you did not request this, you can ignore this email. |
| **CTA button** | Reset Password |

The button must point to the Supabase recovery link (uses `{{ .ConfirmationURL }}`).

## Production checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to production app origin
- [ ] `/reset-password` added to Supabase redirect allow list
- [ ] Reset email template reviewed (subject, CTA, 1-hour expiry note)
- [ ] Rate limits acceptable (app: 30s cooldown + 5/hour per email)
- [ ] Turnstile enabled on forgot-password in production (if configured globally)
- [ ] Manual test: valid account, unknown email, expired link, weak password
- [ ] Confirm login shows success after `/login?reset=success`
- [ ] Confirm no Supabase error strings appear in UI

## Security

- **No enumeration:** success copy is always *"If an account exists for this email, we've sent reset instructions."*
- **No raw Supabase errors** — mapped via `sanitizeAuthError()` in `src/lib/auth/messages.ts`.
- **Throttling:** 30-second resubmit cooldown (client + server) and 5 requests/hour per email.
- **Recovery session:** password update requires valid recovery session from email link.
- **Post-reset:** session cleared; user signs in with new password.

## Customer messages

Defined in `src/lib/auth/messages.ts`:

| Key | Copy |
|-----|------|
| `RESET_SENT` | If an account exists for this email, we've sent reset instructions. |
| `INVALID_EMAIL` | Invalid email address. |
| `RESET_FAILED` | We couldn't send a reset email. |
| `RATE_LIMITED` | Too many attempts. Please try again later. |
| `PASSWORD_TOO_WEAK` | Password too weak. Use at least 12 characters with uppercase, lowercase, and a number. |
| `PASSWORDS_DO_NOT_MATCH` | Passwords do not match. |
| `PASSWORD_UPDATED` | Password updated successfully. |
| `RESET_TOKEN_INVALID` | This reset link is invalid or has expired. |

## Manual test cases

| Case | Steps | Expected |
|------|-------|----------|
| Valid email | Submit registered email on `/forgot-password` | Enumeration-safe success message; email received |
| Invalid email | Submit `not-an-email` | "Invalid email address." |
| Unknown email | Submit valid-format unknown address | Same success message as valid email (no leak) |
| Expired reset token | Open old reset link | Invalid/expired message; link to request new reset |
| Used reset token | Complete reset, reuse same link | Invalid/expired message |
| Mismatched passwords | Different new/confirm on `/reset-password` | "Passwords do not match." |
| Weak password | e.g. `short1A` | Strength indicator + validation error |
| Multiple submissions | Submit forgot form repeatedly | 30s cooldown, then rate limit message |
| Offline mode | Disable network, submit forgot form | Network-friendly error |
| Rate limiting | Exceed hourly limit | "Too many attempts. Please try again later." |
| Login link | Open `/login` | "Forgot password?" visible under password field |
| Success redirect | Complete reset | `/login?reset=success` with success alert |

## Routes

| Route | Purpose |
|-------|---------|
| `/forgot-password` | Request reset email |
| `/reset-password` | Set new password (recovery session) |
| `/login?reset=success` | Confirmation after password update |

## Related code

- `src/lib/auth/reset-actions.ts` — server actions
- `src/lib/auth/password-policy.ts` — password rules + strength
- `src/lib/security/login-throttle.ts` — `checkPasswordResetThrottle`
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/reset-password-form.tsx`
