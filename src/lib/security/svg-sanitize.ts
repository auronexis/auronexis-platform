const DANGEROUS_SVG_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /javascript:/i,
  /on[a-z]+\s*=/i,
  /<foreignObject[\s>]/i,
  /<iframe[\s>]/i,
  /<embed[\s>]/i,
  /<object[\s>]/i,
  /data:text\/html/i,
];

/** Reject SVG uploads containing script handlers or embedded HTML. */
export function assertSafeSvgContent(bytes: Buffer): void {
  const text = bytes.toString("utf-8");

  for (const pattern of DANGEROUS_SVG_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("SVG contains disallowed content. Remove scripts and event handlers.");
    }
  }

  if (!text.includes("<svg")) {
    throw new Error("Invalid SVG file.");
  }
}

/** Sanitize SVG by stripping dangerous patterns — used before storage upload. */
export function sanitizeSvgBytes(bytes: Buffer): Buffer {
  assertSafeSvgContent(bytes);
  let text = bytes.toString("utf-8");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return Buffer.from(text, "utf-8");
}
