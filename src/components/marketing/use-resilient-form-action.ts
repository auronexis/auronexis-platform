"use client";

import { useActionState } from "react";
import { INFO_EMAIL } from "@/lib/company/company-contact";
import type { CaptureActionState } from "@/lib/sales/capture-actions";

/**
 * Client state for public lead forms.
 *
 * - `values` keeps what the visitor typed, so a validation error or a failed
 *   request never wipes the form (React 19 resets uncontrolled fields after
 *   every form action).
 * - `attempt` changes on every submit and is used as the form `key`, so inputs
 *   re-mount with `values` as their default.
 * - `unreachable` is set when the server action itself could not be reached,
 *   e.g. "Failed to find Server Action" after a new deployment. The form then
 *   offers an email fallback so the inquiry is not lost.
 */
export type ResilientFormState = CaptureActionState & {
  values?: Record<string, string>;
  attempt: number;
  unreachable?: boolean;
};

export const FORM_UNREACHABLE_MESSAGE =
  "Your message could not be sent because this page was updated in the meantime. Your entries are kept below. Please reload the page and send again, or email us directly.";

const INITIAL_STATE: ResilientFormState = { attempt: 0 };

function collectValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$") || typeof value !== "string") continue;
    // Consent must be given again on every submit — never pre-tick it.
    if (key === "marketingConsent") continue;
    values[key] = value;
  }
  return values;
}

export function useResilientFormAction(
  action: (prev: CaptureActionState, formData: FormData) => Promise<CaptureActionState>,
) {
  return useActionState<ResilientFormState, FormData>(async (prev, formData) => {
    const values = collectValues(formData);
    const attempt = prev.attempt + 1;
    try {
      const result = await action({}, formData);
      if (result.success) return { success: true, attempt };
      return { error: result.error, values, attempt };
    } catch {
      return { error: FORM_UNREACHABLE_MESSAGE, values, attempt, unreachable: true };
    }
  }, INITIAL_STATE);
}

/** Pre-filled mailto link used as a fallback when the form cannot reach the server. */
export function buildFallbackMailto(subject: string, values: Record<string, string> | undefined): string {
  const lines = Object.entries(values ?? {})
    .filter(([, value]) => value.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`);
  const params = new URLSearchParams({ subject, body: lines.join("\n\n") });
  return `mailto:${INFO_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}
