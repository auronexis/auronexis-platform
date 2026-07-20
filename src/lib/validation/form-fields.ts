import { z } from "zod";

/** Shared optional form text: empty string → null. */
export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

/** Shared ActionState shape used by most Server Actions. */
export type ActionState = {
  error?: string;
  success?: string;
};
