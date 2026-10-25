/**
 * Newsletter: double opt-in, unsubscribe, noreply@ sender.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/newsletter-double-opt-in.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

process.env.NEWSLETTER_TOKEN_SECRET = "test-secret-for-newsletter-tokens";

const tokens = await import("@/lib/newsletter/tokens");
const emails = await import("@/lib/newsletter/emails");

test("tokens round-trip, are bound to their action and normalise the email", () => {
  const confirm = tokens.createNewsletterToken("confirm", " Jane@Example.com ");
  assert.equal(tokens.verifyNewsletterToken("confirm", confirm), "jane@example.com");
  assert.equal(tokens.verifyNewsletterToken("unsubscribe", confirm), null, "confirm token must not unsubscribe");

  const unsub = tokens.createNewsletterToken("unsubscribe", "jane@example.com");
  assert.equal(tokens.verifyNewsletterToken("unsubscribe", unsub), "jane@example.com");
  assert.equal(tokens.verifyNewsletterToken("confirm", unsub), null);
});

test("tampered or expired tokens are rejected", () => {
  const token = tokens.createNewsletterToken("confirm", "jane@example.com");
  const [data, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ a: "confirm", e: "other@example.com", t: Date.now() })).toString("base64url");
  assert.equal(tokens.verifyNewsletterToken("confirm", `${forged}.${sig}`), null);
  assert.equal(tokens.verifyNewsletterToken("confirm", `${data}.x${sig}`), null);
  assert.equal(tokens.verifyNewsletterToken("confirm", ""), null);

  const old = tokens.createNewsletterToken("confirm", "jane@example.com", Date.now() - tokens.CONFIRM_TOKEN_MAX_AGE_MS - 1000);
  assert.equal(tokens.verifyNewsletterToken("confirm", old), null, "confirm links expire");
  const oldUnsub = tokens.createNewsletterToken("unsubscribe", "jane@example.com", Date.now() - 400 * 24 * 3600 * 1000);
  assert.equal(tokens.verifyNewsletterToken("unsubscribe", oldUnsub), "jane@example.com", "unsubscribe links never expire");
});

test("confirmed subscribers need a double opt-in and no later withdrawal", async () => {
  const { resolveConfirmedSubscribers } = await import("@/lib/newsletter/service");
  const rows = [
    { subject_email: "a@x.com", consent_type: "marketing_email", granted: true, recorded_at: "2026-10-01T00:00:00Z" },
    { subject_email: "b@x.com", consent_type: "marketing_email", granted: true, recorded_at: "2026-10-01T00:00:00Z" },
    { subject_email: "b@x.com", consent_type: "newsletter_double_opt_in", granted: true, recorded_at: "2026-10-02T00:00:00Z" },
    { subject_email: "C@x.com", consent_type: "newsletter_double_opt_in", granted: true, recorded_at: "2026-10-02T00:00:00Z" },
    { subject_email: "c@x.com", consent_type: "marketing_email", granted: false, recorded_at: "2026-10-03T00:00:00Z" },
    { subject_email: "d@x.com", consent_type: "marketing_email", granted: false, recorded_at: "2026-10-01T00:00:00Z" },
    { subject_email: "d@x.com", consent_type: "newsletter_double_opt_in", granted: true, recorded_at: "2026-10-05T00:00:00Z" },
  ];
  assert.deepEqual(resolveConfirmedSubscribers(rows), ["b@x.com", "d@x.com"]);
});

test("emails carry the legal sender identity; issues carry an unsubscribe link", () => {
  const confirm = emails.buildNewsletterConfirmationEmail("https://www.auroranexis.com/newsletter/confirm?token=abc");
  assert.match(confirm.html, /Im Malerwinkel 4/);
  assert.match(confirm.text, /newsletter\/confirm\?token=abc/);
  const issue = emails.buildNewsletterIssueEmail({
    subject: "October update",
    bodyText: "First <b>paragraph</b>.\n\nSecond paragraph.",
    unsubscribeUrl: "https://www.auroranexis.com/newsletter/unsubscribe?token=xyz",
  });
  assert.match(issue.html, /newsletter\/unsubscribe\?token=xyz/);
  assert.match(issue.text, /Unsubscribe: https:\/\/www\.auroranexis\.com\/newsletter\/unsubscribe\?token=xyz/);
  assert.ok(!issue.html.includes("<b>paragraph</b>"), "body text is escaped");
});

test("newsletters are always sent from noreply@, with List-Unsubscribe one-click headers", () => {
  const service = readSource("src/lib/newsletter/service.ts");
  assert.match(service, /return getPlatformNoReplySender\("Auroranexis"\)/);
  assert.doesNotMatch(service, /info@auroranexis\.com/);
  assert.equal((service.match(/from: getNewsletterSender\(\)/g) ?? []).length, 2);
  assert.match(service, /"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"/);
  const contact = readSource("src/lib/company/company-contact.ts");
  assert.match(contact, /noReplyEmail: "noreply@auroranexis\.com"/);
});

test("signup sends the confirmation; confirm/unsubscribe only on POST; pages reachable signed-out", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const signup = capture.match(/export async function submitNewsletterSignup[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.match(signup, /sendNewsletterConfirmation\(\{ email: parsed\.data\.email, leadId: result\.leadId \}\)/);

  const route = readSource("src/app/api/newsletter/unsubscribe/route.ts");
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export async function GET/);

  for (const page of ["confirm", "unsubscribe"]) {
    const source = readSource(`src/app/newsletter/${page}/page.tsx`);
    assert.match(source, /createPrivateAppMetadata\(/);
  }
  const middleware = readSource("src/lib/supabase/middleware.ts");
  assert.match(middleware, /pathname === "\/newsletter\/confirm"/);
  assert.match(middleware, /pathname === "\/newsletter\/unsubscribe"/);

  const operator = readSource("src/app/api/operator/newsletter/route.ts");
  assert.match(operator, /verifyCronAuthorization\(request\)/);
});
