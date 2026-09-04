# P0 Forensics — Production Server Action 500 on `POST /`

**Date:** 2026-09-04  
**Repo HEAD:** `36741e8df1c66ca97acbf56329a42609375559c2` (`main`)  
**Observed release:** `36741e8df1c6`  
**Sentry:** `AURORANEXIS-PRODUCTION-2`  
**Error:** `Failed to find Server Action. This request might be from an older or newer deployment.`  
**Transaction:** `POST /(marketing)/page`  
**URL:** `https://www.auroranexis.com/`  

---

## Final verdict

**BENIGN_STALE_OR_MALFORMED_SERVER_ACTION_TRAFFIC**

No application security compromise proven. No justified product code fix in this audit. No commit created.

---

## Incident evidence (given)

| Signal | Value |
| --- | --- |
| Environment | production |
| Release | `36741e8df1c6` |
| Method / route | `POST /` → transaction `POST /(marketing)/page` |
| GET `/` same window | 200 (Vercel) |
| Error text | `Failed to find Server Action. This request might be from an older or newer deployment.` (no quoted action id) |
| Sentry volume | 8 events / 0 users |
| UA note | Mobile Safari / iOS 18.5 present on some events |
| Firewall | allowed |
| Separate noise | `POST /index.php` observed — treated as unrelated scanner traffic |

Regression note: issue existed previously and resurfaced — consistent with recurring external/skew traffic against framework behavior, not a new homepage Server Action bug in `36741e8` (that commit only touched authenticated scroll ownership).

---

## Phase 1 — Repository forensics

### Homepage `/` Server Action surface

| Check | Result |
| --- | --- |
| `src/app/(marketing)/page.tsx` | No `"use server"`, no `action=` / `formAction=` / `useActionState` |
| Local HTML GET `/` | **0** `<form>` elements, **0** `$ACTION_ID_` markers |
| Built `server-reference-manifest.json` workers for `app/(marketing)/page` | **[]** (zero actions registered on the homepage worker) |

Authenticated visitors hitting `/` are redirected to `/dashboard` via `getSession()` — unrelated to this SA failure path (action handling runs before that render path for SA POSTs).

### Marketing-reachable Server Actions (inventory)

Public marketing forms use these `"use server"` modules:

| Module | Export | UI | Routes that register the action (manifest workers) |
| --- | --- | --- | --- |
| `src/lib/marketing/contact-action.ts` | `submitContactForm` → `submitContactLead` | `ContactForm` | `/contact`, `/support` |
| `src/lib/sales/capture-actions.ts` | `submitDemoRequest` | `DemoBookingForm` | `/contact`, `/enterprise`, `/pilot-program`, `/pricing` |
| `src/lib/sales/capture-actions.ts` | `submitReferralLead` | `ReferralLeadForm` | same |
| `src/lib/sales/capture-actions.ts` | `submitNewsletterSignup` | `NewsletterSignupForm` | same (UI currently on `/pricing`) |
| `src/lib/sales/capture-actions.ts` | `submitPilotApplication` | `PilotApplicationForm` | same (UI on `/pilot-program`) |
| `src/lib/sales/capture-actions.ts` | `submitContactLead` | (via contact-action wrapper) | same capture workers |

`MarketingShell` / `SiteFooter` / cookie consent / root layout: **no** Server Actions.

### Which Server Action can legitimately `POST /`?

**None in the current tree.**  
Next.js posts Server Actions to the **page URL where the form was rendered**. Homepage has no SA forms and no SA worker entries. A legitimate contact/demo/newsletter/pilot submit posts to `/contact`, `/pricing`, `/pilot-program`, etc. — not `/`.

### Registration / config

- Next.js `15.5.23`
- `next.config.ts`: **no** `experimental.serverActions` / `allowedOrigins` overrides
- Action IDs are non-deterministic per build (framework security design)
- `src/instrumentation.ts` exports `onRequestError = Sentry.captureRequestError` → framework-thrown SA miss errors are captured as production issues
- No Vercel Skew Protection config found in `vercel.json`

### Git / deploy skew notes

- `36741e8` did not change marketing forms or Server Actions
- Homepage history search found no prior `ContactForm` / `NewsletterSignupForm` / `formAction` on `src/app/(marketing)/page.tsx`
- Action IDs change every build by design → stale clients on **form pages** can 500 after deploy; that is separate from why the failing transaction is specifically `/(marketing)/page`

### Compatibility matrix (evidence-gated)

| Hypothesis | Compatible with evidence? | Notes |
| --- | --- | --- |
| A Stale browser on current `/` form | **Weak for `/` specifically** | `/` has never hosted these forms; stale `/contact` would normally POST `/contact` |
| B Bot / malformed multipart POST | **Yes — reproduced** | Multipart with invalid/missing `$ACTION_*` → exact Sentry message + HTTP 500 |
| C Real current frontend bug | **No** | No SA on `/`; current fetch unknown-id path returns **404**, not this 500 |
| D Deployment skew | **Partial** | Explains form-page stale IDs; incident URL is `/` which has no SA workers |
| E Unstable action identity | **By design** | Not an Auroranexis bug; IDs intentionally change per build |
| F Other | Framework MPA miss → 500 | Next.js `action-handler.js` E787 path |

---

## Phase 2 — Request characteristics

### Legitimate Server Action POST (fetch / RSC)

- Header: `Next-Action: <42-char id>`
- Typically `Accept: text/x-component`
- Body: flight/encoded reply payload
- Unknown / stale id → Next.js `handleUnrecognizedFetchAction` → **HTTP 404** + `x-nextjs-action-not-found: 1` + body `Server action not found.`
- Log line includes quoted id: `Failed to find Server Action "<id>"...`
- **Does not match** the Sentry message shape (no quoted id) or the observed **500**

### MPA / multipart Server Action POST (progressive enhancement or crafted)

- `Content-Type: multipart/form-data`
- Fields like `$ACTION_ID_<id>` / `$ACTION_REF_*`
- No `Next-Action` header required for the handler to treat it as a possible SA
- Invalid / missing / stale action fields → Next.js throws E787:  
  `Failed to find Server Action. This request might be from an older or newer deployment.`  
  → **HTTP 500** → `onRequestError` → Sentry

### Arbitrary internet traffic

**Yes.** Any client can `POST /` with multipart form fields shaped like Next.js MPA actions (or even multipart without valid `$ACTION_*` fields) and trigger this framework 500. No authentication required. **No Server Action body executes** on this miss path (throw occurs before `decodeAction` execution / `executeActionAndPrepareForRender`).

Plain `application/x-www-form-urlencoded` POST `/` without SA semantics: local repro returned **200** (page render), not this error.

CSRF: Next.js still validates `Origin` vs host for action handling; CSRF abort is a different error (`Invalid Server Actions request.`).

---

## Phase 3 — Reproduction matrix (local `next start`, port 3011)

Environment: production build + required Supabase public env loaded for middleware.  
Script: `.recert-evidence/sa-500-repro.mjs`

| Test | Request | HTTP | App SA code runs? | Matches Sentry? |
| --- | --- | --- | --- | --- |
| A | `GET /` | **200** | n/a | n/a |
| B | `POST /contact` + `Next-Action: <current capture/contact id>` + `[]` body | **500** (arg decode/`entries` TypeError — id **was found**) | Handler entered; not “unknown action” | No (different error) |
| C | `POST /` + unknown `Next-Action` | **404** + `x-nextjs-action-not-found: 1` | No | No (404 + quoted id in logs) |
| C3 | `POST /` multipart + stale `$ACTION_ID_*` | **500** | No | **Yes** — exact message, no quoted id |
| D | `POST /` `x-www-form-urlencoded` | **200** | No SA path | No |
| E | `POST /` multipart + **current** contact action id | **500** | No (id not in homepage worker / MPA miss) | Message may include quoted id — close but Sentry sample lacked quotes |

**Conclusion:** The Sentry 500 signature matches the **MPA / multipart unknown-action throw**, not the fetch `Next-Action` 404 path.

---

## Phase 4 — Security classification

| Question | Answer |
| --- | --- |
| 1. Compromise? | **No evidence of compromise** |
| 2. Can unauthenticated attacker execute arbitrary Server Action? | **No.** Unknown ids do not execute. Knowing a current public action id only reaches that specific exported action (e.g. throttled contact capture) — by design for public forms, with Origin checks |
| 3. Only malformed/stale action-id handling? | **Yes — primary mechanism** |
| 4. Data read/mutated on this failure? | **No** on the miss/throw path |
| 5. Auth bypassed? | **No** |
| 6. Secret exposure? | **No** |
| 7. Primary class | **OBSERVABILITY NOISE** from framework 500s on malformed/stale SA-shaped POSTs to a route with **no** Server Actions; **possible contribution** from deployment skew on *other* form routes, but the failing transaction is specifically homepage. Not a P0 security defect |

Do not equate “unauthenticated POST can cause HTTP 500” with RCE or auth bypass — here it is framework input rejection expressed as 500.

---

## Phase 5 — Root cause

**ROOT CAUSE:** Next.js App Router treats multipart `POST /` as a possible Server Action. When action form fields are missing, stale, or otherwise invalid, `action-handler` throws `Failed to find Server Action. This request might be from an older or newer deployment.` (E787) and responds **500**. The marketing homepage registers **zero** Server Actions, so any SA-shaped POST to `/` is non-legitimate for the current app. Sentry records these throws via `onRequestError`.

**EVIDENCE:**

1. Homepage source + HTML + `server-reference-manifest` workers: no SA on `app/(marketing)/page`
2. Local multipart stale/`$ACTION_ID_` POST `/` reproduces **exact** error text and **500**
3. Local `Next-Action` unknown POST `/` returns **404**, not the incident signature
4. Next.js 15.5.23 `node_modules/next/dist/server/app-render/action-handler.js` documents this MPA throw (TODO notes skew/manipulated input should be handled more gracefully)
5. Official docs: https://nextjs.org/docs/messages/failed-to-find-server-action

**CONFIDENCE:** **HIGH** for mechanism and non-security nature. **MEDIUM** for attributing each production event to bot vs stale client (needs Sentry request `Content-Type` / body field names per event).

---

## Phase 6 — Remediation

**No product code change applied.** Reasons:

- Legitimate marketing forms are not on `/` and were not broken by this investigation
- Swallowing all multipart POST `/` in middleware is a brittle framework workaround (risk of surprising future homepage forms; easy to get wrong vs Next internals)
- Hiding the Sentry issue without per-event confirmation of Content-Type would risk masking a future real SA regression on other routes if filters are too broad
- Skew protection and observability tuning are operator/platform actions, not unsafe app hacks

### Recommended operator actions (no deploy required from this audit)

1. In Sentry issue `AURORANEXIS-PRODUCTION-2`, confirm request headers: `content-type` multipart vs presence of `next-action`
2. Enable **Vercel Skew Protection** for production (reduces real-user stale action ids after deploy on form routes)
3. Keep treating `POST /index.php` as unrelated scanner noise
4. Optional later (only if volume becomes noisy and headers confirm MPA/malformed on `/` only): narrow Sentry `ignoreErrors` / `beforeSend` for this **exact** message **and** transaction `POST /(marketing)/page` — do **not** globally ignore “Failed to find Server Action” across the app
5. No secret rotation, no auth/RLS/billing changes

---

## Phase 7 — Validation performed

| Check | Result |
| --- | --- |
| Local GET `/` | 200 |
| Local plain POST `/` | 200 |
| Local unknown `Next-Action` POST `/` | 404 + not-found header |
| Local multipart stale SA POST `/` | 500 + exact Sentry message |
| Marketing SA inventory | Documented; forms on `/contact`, `/pricing`, `/pilot-program`, `/support`, `/enterprise` |
| Auth / Mollie / RLS | Not modified |
| Commit | **None** (no justified code fix) |
| Push / deploy | **Not done** |

Full `lint` / `typecheck` / `build` gate not re-run: no source changes.

---

## Phase 8 — Summary

| Item | Value |
| --- | --- |
| Affected route | `POST /` (`/(marketing)/page`) |
| App Server Actions on that route | **None** |
| Primary class | Observability noise / malformed or stale SA-shaped traffic |
| Security | Not a compromise; not arbitrary SA execution |
| Code fix | None in this audit |
| Commit | None |
| Report | `docs/p0-production-server-action-500-forensics.md` |

**VERDICT: BENIGN_STALE_OR_MALFORMED_SERVER_ACTION_TRAFFIC**
