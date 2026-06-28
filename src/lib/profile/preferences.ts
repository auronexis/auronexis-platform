export type ThemePreference = "light" | "dark" | "system";
export type DateFormatPreference = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type TimeFormatPreference = "12h" | "24h";

export type AccountExtras = {
  displayName: string;
  phone: string;
  jobTitle: string;
};

export type RegionalPreferences = {
  timezone: string;
  language: string;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
};

export type AppearancePreferences = {
  theme: ThemePreference;
  compactMode: boolean;
  reduceAnimations: boolean;
  sidebarCollapsed: boolean;
};

export type NotificationPreferences = {
  email: boolean;
  browser: boolean;
  weeklyDigest: boolean;
  riskAlerts: boolean;
  incidentAlerts: boolean;
  reportCompleted: boolean;
  teamInvitations: boolean;
};

export type UserPreferences = {
  account: AccountExtras;
  regional: RegionalPreferences;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
};

export const USER_PREFERENCES_STORAGE_KEY = "auroranexis:user-preferences";
export const USER_PREFERENCES_UPDATED_EVENT = "auroranexis-preferences-updated";

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function createDefaultPreferences(): UserPreferences {
  return {
    account: {
      displayName: "",
      phone: "",
      jobTitle: "",
    },
    regional: {
      timezone: detectTimezone(),
      language: "en",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
    },
    appearance: {
      theme: "system",
      compactMode: false,
      reduceAnimations: false,
      sidebarCollapsed: false,
    },
    notifications: {
      email: true,
      browser: false,
      weeklyDigest: true,
      riskAlerts: true,
      incidentAlerts: true,
      reportCompleted: true,
      teamInvitations: true,
    },
  };
}

/** Deterministic defaults for SSR and the first client render — no localStorage or browser APIs. */
export function createStableDefaultPreferences(): UserPreferences {
  return {
    account: {
      displayName: "",
      phone: "",
      jobTitle: "",
    },
    regional: {
      timezone: "UTC",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
    },
    appearance: {
      theme: "system",
      compactMode: false,
      reduceAnimations: false,
      sidebarCollapsed: false,
    },
    notifications: {
      email: true,
      browser: false,
      weeklyDigest: true,
      riskAlerts: true,
      incidentAlerts: true,
      reportCompleted: true,
      teamInvitations: true,
    },
  };
}

export function mergePreferences(stored: Partial<UserPreferences>): UserPreferences {
  const defaults = createDefaultPreferences();

  return {
    account: { ...defaults.account, ...stored.account },
    regional: { ...defaults.regional, ...stored.regional },
    appearance: { ...defaults.appearance, ...stored.appearance },
    notifications: { ...defaults.notifications, ...stored.notifications },
  };
}

export function parseStoredPreferences(raw: string | null): UserPreferences {
  if (!raw) {
    return createDefaultPreferences();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return mergePreferences(parsed);
  } catch {
    return createDefaultPreferences();
  }
}

export function loadUserPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return createStableDefaultPreferences();
  }

  return parseStoredPreferences(localStorage.getItem(USER_PREFERENCES_STORAGE_KEY));
}

export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(USER_PREFERENCES_UPDATED_EVENT));
}

export function resolveThemeClass(theme: ThemePreference): "light" | "dark" {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function applyUserPreferences(preferences: UserPreferences): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const resolvedTheme = resolveThemeClass(preferences.appearance.theme);

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.dataset.theme = preferences.appearance.theme;

  root.classList.toggle("compact-mode", preferences.appearance.compactMode);
  root.classList.toggle("reduce-motion", preferences.appearance.reduceAnimations);
  root.dataset.sidebarCollapsed = preferences.appearance.sidebarCollapsed ? "true" : "false";
}

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export const LANGUAGE_OPTIONS = [{ value: "en", label: "English" }] as const;

export const DATE_FORMAT_OPTIONS: { value: DateFormatPreference; label: string }[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];
