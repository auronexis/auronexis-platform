const BLOCKED_PATTERNS = [
  /@import/i,
  /expression\s*\(/i,
  /javascript:/i,
  /<script/i,
  /url\s*\(\s*['"]?\s*javascript:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
];

export function sanitizeCustomCss(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error("Custom CSS contains blocked content.");
    }
  }

  return trimmed.slice(0, 8000);
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.startsWith("#") ? value : `#${value}`);
}

export function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidDomain(value: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value.trim(),
  );
}
