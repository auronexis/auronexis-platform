/** Reject open redirects — only same-origin relative paths are allowed. */
export function resolveSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) {
    return fallback;
  }

  let trimmed = next.trim();
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://") ||
    trimmed.includes("@") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
