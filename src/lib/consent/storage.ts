import {
  ALL_ACCEPTED_CONSENT,
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  type ConsentChangeDetail,
  type ConsentPreferences,
  type StoredConsent,
} from "@/lib/consent/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readConsent(): StoredConsent | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasConsentDecision(): boolean {
  return readConsent() !== null;
}

export function getConsentPreferences(): ConsentPreferences {
  return readConsent() ?? DEFAULT_CONSENT;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentPreferences().analytics;
}

export function hasMarketingConsent(): boolean {
  return getConsentPreferences().marketing;
}

export function writeConsent(
  preferences: ConsentPreferences,
  source: ConsentChangeDetail["source"],
): StoredConsent {
  const stored: StoredConsent = {
    ...preferences,
    essential: true,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    window.dispatchEvent(
      new CustomEvent<ConsentChangeDetail>(CONSENT_CHANGED_EVENT, {
        detail: { preferences: stored, source },
      }),
    );
  }

  return stored;
}

export function acceptAllConsent(source: ConsentChangeDetail["source"] = "banner"): StoredConsent {
  return writeConsent(ALL_ACCEPTED_CONSENT, source);
}

export function rejectNonEssentialConsent(
  source: ConsentChangeDetail["source"] = "banner",
): StoredConsent {
  return writeConsent(DEFAULT_CONSENT, source);
}

export function subscribeToConsentChanges(
  listener: (detail: ConsentChangeDetail) => void,
): () => void {
  if (!isBrowser()) return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<ConsentChangeDetail>;
    if (custom.detail) listener(custom.detail);
  };

  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
}
