/**
 * Self-serve free trial — pure policy (no I/O), shared by signup, entitlements and UI.
 *
 * - 7 days on the Business plan, no payment details, ends automatically (no auto-renewal).
 * - Limits keep the trial useful for evaluation but useless for abuse: 10 clients, 3 seats,
 *   50 AI credits, report emails only to members of the own workspace.
 * - One trial per normalized email address and per company domain.
 */
import type { PlanKey } from "@/lib/billing/plans";

export const TRIAL_LENGTH_DAYS = 7;
export const TRIAL_PLAN: PlanKey = "business";
export const TRIAL_CLIENT_LIMIT = 10;
export const TRIAL_SEAT_LIMIT = 3;
export const TRIAL_AI_CREDITS = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Public mailbox providers: one trial per address, not per domain. */
export const FREEMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.de", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.de", "gmx.net", "gmx.com", "gmx.at", "gmx.ch", "web.de",
  "t-online.de", "freenet.de", "posteo.de", "mailbox.org", "zoho.com", "yandex.com", "yandex.ru",
  "mail.com", "mail.ru", "fastmail.com", "tutanota.com", "tuta.io", "hey.com", "bigpond.com",
  "optusnet.com.au", "xtra.co.nz", "btinternet.com", "sky.com", "virginmedia.com", "comcast.net",
  "verizon.net", "att.net", "sbcglobal.net", "orange.fr", "wanadoo.fr", "free.fr", "laposte.net",
  "libero.it", "virgilio.it", "seznam.cz", "wp.pl", "o2.pl", "interia.pl", "qq.com", "163.com",
]);

/** Throwaway mailbox providers: no account, no trial. */
export const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
  "grr.la", "10minutemail.com", "10minutemail.net", "temp-mail.org", "tempmail.com", "tempmail.net",
  "tempmailo.com", "temp-mail.io", "tmpmail.org", "tmpmail.net", "yopmail.com", "yopmail.fr",
  "yopmail.net", "trashmail.com", "trashmail.de", "trashmail.net", "getnada.com", "nada.email",
  "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com",
  "emailondeck.com", "moakt.com", "tempail.com", "burnermail.io", "mohmal.com", "mailnesia.com",
  "mytemp.email", "spamgourmet.com", "spambox.us", "33mail.com", "inboxkitten.com", "mailpoof.com",
  "emailfake.com", "fakemail.net", "discard.email", "einrot.com", "wegwerfmail.de", "wegwerfmail.net",
  "spambog.com", "byom.de", "trash-mail.com", "mailcatch.com", "tempinbox.com", "mail.tm",
  "tempr.email", "anonaddy.me", "minuteinbox.com", "luxusmail.org", "cock.li",
]);

export type NormalizedEmail = {
  /** Lowercased address with "+tag" removed (and dots removed for Gmail). */
  normalized: string;
  domain: string;
  isFreemail: boolean;
  isDisposable: boolean;
};

export function normalizeEmailForTrial(email: string): NormalizedEmail | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return null;
  }
  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  if (domain === "googlemail.com") {
    domain = "gmail.com";
  }
  const plus = local.indexOf("+");
  if (plus > 0) {
    local = local.slice(0, plus);
  }
  if (domain === "gmail.com") {
    local = local.replace(/\./g, "");
  }
  const isDisposable = DISPOSABLE_DOMAINS.has(domain) || [...DISPOSABLE_DOMAINS].some((d) => domain.endsWith(`.${d}`));
  return {
    normalized: `${local}@${domain}`,
    domain,
    isFreemail: FREEMAIL_DOMAINS.has(domain),
    isDisposable,
  };
}

export function computeTrialExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRIAL_LENGTH_DAYS * DAY_MS);
}

export function isTrialExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) {
    return true;
  }
  const end = Date.parse(expiresAt);
  return Number.isNaN(end) || end <= now.getTime();
}

/** Whole days left, rounded up (6 days 2 hours → 7). 0 when expired. */
export function trialDaysRemaining(expiresAt: string | null, now: Date = new Date()): number {
  if (isTrialExpired(expiresAt, now)) {
    return 0;
  }
  return Math.ceil((Date.parse(expiresAt as string) - now.getTime()) / DAY_MS);
}

type OverrideLike = { source?: string | null; status: string } | null | undefined;

/**
 * A trial override stops applying as soon as the workspace has a usable paid subscription —
 * the paid plan wins, the trial does not stack on top of it.
 */
export function overrideAppliesWithSubscription<T extends OverrideLike>(
  override: T,
  hasUsableSubscription: boolean,
): T | null {
  if (!override) {
    return null;
  }
  if (override.source === "trial" && hasUsableSubscription) {
    return null;
  }
  return override;
}
