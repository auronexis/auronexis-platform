import {
  CALENDLY_DISCOVERY_URL,
  GOOGLE_CALENDAR_DISCOVERY_URL,
  GOOGLE_MEET_BASE_URL,
} from "@/lib/env";

export type BookingLinks = {
  calendlyDiscoveryUrl: string | null;
  googleCalendarUrl: string | null;
  googleMeetBaseUrl: string | null;
  configured: boolean;
};

export function getBookingLinks(): BookingLinks {
  const calendlyDiscoveryUrl = CALENDLY_DISCOVERY_URL ?? null;
  const googleCalendarUrl = GOOGLE_CALENDAR_DISCOVERY_URL ?? null;
  const googleMeetBaseUrl = GOOGLE_MEET_BASE_URL ?? null;

  return {
    calendlyDiscoveryUrl,
    googleCalendarUrl,
    googleMeetBaseUrl,
    configured: Boolean(calendlyDiscoveryUrl || googleCalendarUrl),
  };
}

export function buildDiscoveryMeetLink(seed?: string): string | null {
  const base = GOOGLE_MEET_BASE_URL;
  if (!base) {
    return null;
  }

  if (!seed) {
    return base;
  }

  return `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(seed)}`;
}

export function buildCalendlyLink(email?: string, company?: string): string | null {
  const base = CALENDLY_DISCOVERY_URL;
  if (!base) {
    return null;
  }

  const url = new URL(base);
  if (email) {
    url.searchParams.set("email", email);
  }
  if (company) {
    url.searchParams.set("a1", company);
  }
  return url.toString();
}
