/** Reject open redirects — only same-origin relative paths are allowed. */
export function resolveSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) {
    return fallback;
  }

  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}
