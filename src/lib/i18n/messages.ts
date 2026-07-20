/**
 * Message catalog scaffold for future language packs.
 * Keys are stable; values are English source strings. Do not machine-translate here.
 */
export type MessageCatalog = Record<string, string>;

export const COMMON_MESSAGES = {
  "common.emDash": "—",
  "common.loading": "Loading…",
  "common.save": "Save changes",
  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.notAvailable": "Not available",
  "common.justNow": "just now",
  "regional.timezone": "Timezone",
  "regional.dateFormat": "Date format",
  "regional.timeFormat": "Time format",
  "regional.weekStart": "Week starts on",
  "regional.measurementSystem": "Measurement system",
  "regional.workspaceCurrency": "Workspace currency",
  "regional.language": "Language",
} as const satisfies MessageCatalog;

export type CommonMessageKey = keyof typeof COMMON_MESSAGES;

/** Resolve a catalog string — language packs can replace catalogs later. */
export function t(
  key: CommonMessageKey,
  catalog: typeof COMMON_MESSAGES = COMMON_MESSAGES,
): string {
  return catalog[key] ?? key;
}
