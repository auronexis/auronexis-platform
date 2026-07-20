import "server-only";

/** Bracket access avoids Next.js build-time env inlining in Server Actions. */
export function isSecurityEnforcementDisabledForE2E(): boolean {
  // Production must never activate E2E / test security bypasses.
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return (
    process.env["TURNSTILE_DISABLE"] === "1" ||
    process.env["E2E_DISABLE_RATE_LIMIT"] === "1"
  );
}
