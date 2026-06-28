/** Shared AI output validation — reject invalid generations before returning to UI. */

export type AIValidationOptions = {
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
};

export type AIValidationResult =
  | { valid: true; content: string }
  | { valid: false; reason: string };

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const REPEATED_PARAGRAPH_PATTERN = /([\s\S]{40,}?)\1{2,}/;

export function stripUnsupportedHtml(content: string): string {
  return content.replace(/<[^>]+>/g, "").trim();
}

export function normalizeAIOutput(content: string): string {
  return content.replace(/\r\n/g, "\n").trim();
}

/** Validate AI output before surfacing to users. */
export function validateAIOutput(
  raw: string,
  options: AIValidationOptions = {},
): AIValidationResult {
  const minLength = options.minLength ?? 1;
  const maxLength = options.maxLength ?? 50_000;
  const content = normalizeAIOutput(stripUnsupportedHtml(raw));

  if (!options.allowEmpty && content.length === 0) {
    return { valid: false, reason: "Empty output" };
  }

  if (content.length < minLength && !options.allowEmpty) {
    return { valid: false, reason: "Output too short" };
  }

  if (content.length > maxLength) {
    return { valid: false, reason: "Output too long" };
  }

  if (HTML_TAG_PATTERN.test(raw)) {
    return { valid: false, reason: "Unsupported HTML in output" };
  }

  if (REPEATED_PARAGRAPH_PATTERN.test(content)) {
    return { valid: false, reason: "Repeated paragraphs detected" };
  }

  return { valid: true, content };
}

export function assertValidAIOutput(raw: string, options?: AIValidationOptions): string {
  const result = validateAIOutput(raw, options);
  if (!result.valid) {
    throw new Error("invalid_response");
  }
  return result.content;
}
