import type { NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";

/** Apply production security headers without altering auth behavior. */
export function applySecurityHeaders<T extends NextResponse>(response: T): T {
  const includeHsts = process.env.NODE_ENV === "production";

  for (const header of getSecurityHeaders(includeHsts)) {
    response.headers.set(header.key, header.value);
  }

  return response;
}
