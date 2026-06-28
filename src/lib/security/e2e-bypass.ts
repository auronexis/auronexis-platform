import "server-only";

/** Bracket access avoids Next.js build-time env inlining in Server Actions. */
export function isSecurityEnforcementDisabledForE2E(): boolean {
  return (
    process.env["TURNSTILE_DISABLE"] === "1" ||
    process.env["E2E_DISABLE_RATE_LIMIT"] === "1"
  );
}
