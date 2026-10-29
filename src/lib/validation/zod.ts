import { z } from "zod";

/**
 * Shared zod entry point (zod 4).
 *
 * zod 4 changed its default messages: a missing form field now reads
 * "Invalid input: expected string, received null" instead of zod 3's "Required".
 * Several actions show `issues[0].message` to the user, so missing values keep the
 * short zod 3 wording. Every other issue uses zod 4's default English message, and
 * custom messages in schemas always win.
 */
export function friendlyMissingValueMessage(issue: { code: string; input?: unknown }): string | undefined {
  if (issue.code === "invalid_type" && (issue.input === undefined || issue.input === null)) {
    return "Required";
  }
  return undefined;
}

z.config({ customError: friendlyMissingValueMessage });

export { z };
