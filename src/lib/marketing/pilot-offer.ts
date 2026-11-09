/**
 * The one wording of the 6-week pilot offer.
 *
 * The pilot page, homepage, guide pages, page metadata, structured data, llms.txt and the FAQs
 * all describe the same offer, so they read it from here instead of repeating it. Change the
 * offer only here, and only to something Auroranexis actually provides.
 *
 * This module has no imports on purpose: company schema and SEO modules can use it without
 * creating import cycles.
 */
export const PILOT_OFFER = {
  durationLabel: "6-week pilot",
  /** What a pilot participant gets, written to follow "The pilot includes". */
  includes:
    "guided workspace setup with your own clients, weekly written check-ins and pilot terms agreed in writing",
  /** What applying costs and commits the applicant to. */
  applyTerms: "Applying is free and non-binding.",
  /** Outreach emails link to the pilot page; this tells recipients they may apply. */
  invitation: "An email invitation from Auroranexis counts as your invitation.",
} as const;

/** "Guided workspace setup with …" — the includes list as the start of a sentence. */
export const PILOT_OFFER_INCLUDES_SENTENCE = `${PILOT_OFFER.includes.charAt(0).toUpperCase()}${PILOT_OFFER.includes.slice(1)}.`;
