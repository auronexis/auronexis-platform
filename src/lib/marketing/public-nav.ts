import { getSession, readSessionContext, readSessionContextFromRequest } from "@/lib/auth/session";
import {
  getMarketingAuthState,
  getPublicHeaderNavLinks,
  type MarketingAuthState,
  type PublicHeaderNav,
} from "@/lib/marketing/auth-context";
import type { NextRequest } from "next/server";

export type PublicNavState = MarketingAuthState;

/** Server-side public navigation auth state — reads Supabase session from cookies. */
export async function getPublicNavState(): Promise<PublicNavState> {
  const session = await getSession();
  return getMarketingAuthState(session);
}

/** Route handlers and non-RSC contexts — bypass React request cache. */
export async function getPublicNavStateUncached(): Promise<PublicNavState> {
  const session = await readSessionContext();
  return getMarketingAuthState(session);
}

/** Read auth state from an incoming HTTP request (e.g. `/api/docs`). */
export async function getPublicNavStateFromRequest(request: NextRequest): Promise<PublicNavState> {
  const session = await readSessionContextFromRequest(request);
  return getMarketingAuthState(session);
}

export { getPublicHeaderNavLinks, type PublicHeaderNav };
