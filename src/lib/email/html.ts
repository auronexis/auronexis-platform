/** Escape text for safe interpolation into HTML email templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Branded CTA button — visible label is never a raw URL. */
export function buildEmailCtaButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeHref}" style="display:inline-block;padding:12px 24px;background-color:#2563EB;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${safeLabel}</a>`;
}
