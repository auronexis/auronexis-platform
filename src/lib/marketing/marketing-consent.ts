/**
 * Public marketing consent purpose text and version for newsletter / optional opt-in.
 * Version bumps when purpose language or scope changes (consent evidence integrity).
 */

export const MARKETING_CONSENT_PURPOSE_VERSION = "marketing-email-2026-09-02-v1" as const;

export const MARKETING_CONSENT_PURPOSE =
  "Receive product updates, newsletters, and occasional marketing emails from Auroranexis about the platform and related services." as const;

export const MARKETING_CONSENT_TYPE = "marketing_email" as const;
