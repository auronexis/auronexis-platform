import { hasAnalyticsConsent } from "@/lib/consent/storage";

export type AnalyticsIdentityInput = {
  userId: string;
  role: string;
  isInternal: boolean;
};

type PostHogIdentityClient = {
  identify?: (distinctId: string, setProps?: Record<string, string | boolean>) => void;
  get_distinct_id?: () => string;
};

let currentIdentity: AnalyticsIdentityInput | null = null;

export function setAnalyticsIdentity(identity: AnalyticsIdentityInput | null): void {
  currentIdentity = identity;
}

/**
 * Identify the signed-in user in PostHog. Runs only with analytics consent (identification needs
 * a stored id); without consent PostHog stays anonymous and cookieless. Safe to call repeatedly —
 * it is called on mount and again once PostHog finishes loading.
 */
export function applyAnalyticsIdentity(): void {
  if (typeof window === "undefined" || !currentIdentity || !hasAnalyticsConsent()) return;
  const posthog = (window as Window & { posthog?: PostHogIdentityClient }).posthog;
  if (!posthog?.identify) return;
  try {
    if (posthog.get_distinct_id?.() === currentIdentity.userId) return;
    posthog.identify(currentIdentity.userId, {
      role: currentIdentity.role,
      $internal_or_test_user: currentIdentity.isInternal,
    });
  } catch {
    // Analytics must never break the app.
  }
}
