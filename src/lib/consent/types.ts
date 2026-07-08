export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentPreferences & {
  version: number;
  decidedAt: string;
};

export const CONSENT_STORAGE_KEY = "auroranexis:cookie-consent";
export const CONSENT_VERSION = 1;

export const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export const ALL_ACCEPTED_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: true,
  marketing: true,
};

export type ConsentChangeDetail = {
  preferences: ConsentPreferences;
  source: "banner" | "modal" | "storage";
};

export const CONSENT_CHANGED_EVENT = "auroranexis:consent-changed";
