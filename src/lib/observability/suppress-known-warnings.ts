/**
 * Silences one known, harmless Node.js deprecation warning so it no longer shows up as a red
 * "error" line in Vercel runtime logs.
 *
 * DEP0169 (`url.parse()`) is emitted from inside `@mollie/api-client` (it bundles node-fetch v2)
 * on every Mollie API call. We do not call `url.parse()` ourselves and cannot change the
 * dependency, and Vercel labels anything written to stderr as an error, which hides real
 * problems in the noise. All other warnings are passed through unchanged.
 */
const SUPPRESSED_WARNING_CODES = new Set(["DEP0169"]);

let installed = false;

function warningCode(warning: unknown, args: unknown[]): string | undefined {
  if (warning && typeof warning === "object" && "code" in warning) {
    const code = (warning as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  const [typeOrOptions, code] = args;
  if (typeOrOptions && typeof typeOrOptions === "object" && "code" in typeOrOptions) {
    const optionCode = (typeOrOptions as { code?: unknown }).code;
    if (typeof optionCode === "string") return optionCode;
  }
  return typeof code === "string" ? code : undefined;
}

export function suppressKnownNodeWarnings(): void {
  if (installed || typeof process === "undefined" || typeof process.emitWarning !== "function") {
    return;
  }
  installed = true;
  const original = process.emitWarning.bind(process) as (...args: unknown[]) => void;
  process.emitWarning = ((warning: unknown, ...args: unknown[]) => {
    const code = warningCode(warning, args);
    if (code && SUPPRESSED_WARNING_CODES.has(code)) {
      return;
    }
    original(warning, ...args);
  }) as typeof process.emitWarning;
}
