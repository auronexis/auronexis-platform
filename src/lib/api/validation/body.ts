import { z } from "zod";

export async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiValidationError("Invalid JSON body.");
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiValidationError(parsed.error.issues[0]?.message ?? "Invalid request body.");
  }

  return parsed.data;
}

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiValidationError";
  }
}
