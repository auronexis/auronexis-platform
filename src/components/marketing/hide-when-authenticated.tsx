import type { ReactNode } from "react";
import { getPublicNavState } from "@/lib/marketing/public-nav";

type HideWhenAuthenticatedProps = {
  children: ReactNode;
};

/** Hides anonymous-only CTAs such as Book demo when a workspace session exists. */
export async function HideWhenAuthenticated({ children }: HideWhenAuthenticatedProps) {
  const auth = await getPublicNavState();
  if (auth.isAuthenticated) {
    return null;
  }

  return children;
}
