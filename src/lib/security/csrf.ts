import "server-only";

import { headers } from "next/headers";

/** Validate same-origin for server actions when Origin/Referer headers are present. */
export async function assertSameOriginRequest(): Promise<boolean> {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");

  if (!host) {
    return true;
  }

  const expectedHttp = `http://${host}`;
  const expectedHttps = `https://${host}`;

  if (origin) {
    return origin === expectedHttp || origin === expectedHttps;
  }

  if (referer) {
    return referer.startsWith(`${expectedHttp}/`) || referer.startsWith(`${expectedHttps}/`);
  }

  return true;
}
