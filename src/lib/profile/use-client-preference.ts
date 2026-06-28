"use client";

import { useUserPreferences } from "@/components/profile/user-preferences-provider";

/**
 * Gate browser-only preference UI until localStorage has been read after mount.
 * SSR and the first client render use stable defaults; `ready` becomes true once hydrated.
 */
export function useClientPreference(): { ready: boolean } {
  const { isHydrated } = useUserPreferences();
  return { ready: isHydrated };
}
