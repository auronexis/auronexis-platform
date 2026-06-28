import type { IntegrationSecretReference } from "@/lib/integrations/types";

const TEMPLATE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export function applyTemplateVariables(
  value: string,
  context: Record<string, unknown> = {},
): string {
  return value.replace(TEMPLATE_PATTERN, (_match, key: string) => {
    const resolved = resolveContextPath(context, key);
    if (resolved == null) {
      return "";
    }

    if (typeof resolved === "object") {
      return JSON.stringify(resolved);
    }

    return String(resolved);
  });
}

export function applyTemplateVariablesToRecord(
  record: Record<string, string>,
  context: Record<string, unknown> = {},
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, applyTemplateVariables(value, context)]),
  );
}

export function applyTemplateVariablesToBody(
  body: unknown,
  context: Record<string, unknown> = {},
): unknown {
  if (typeof body === "string") {
    return applyTemplateVariables(body, context);
  }

  if (Array.isArray(body)) {
    return body.map((item) => applyTemplateVariablesToBody(item, context));
  }

  if (body && typeof body === "object") {
    return Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([key, value]) => [
        key,
        applyTemplateVariablesToBody(value, context),
      ]),
    );
  }

  return body;
}

function resolveContextPath(context: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, context);
}

export function extractSecretReferences(config: unknown): IntegrationSecretReference[] {
  if (!config || typeof config !== "object") {
    return [];
  }

  const record = config as Record<string, unknown>;
  const refs: IntegrationSecretReference[] = [];

  if (record.secretId && typeof record.secretId === "string") {
    refs.push({
      secretId: record.secretId,
      label: typeof record.secretLabel === "string" ? record.secretLabel : undefined,
    });
  }

  if (Array.isArray(record.secrets)) {
    for (const item of record.secrets) {
      if (item && typeof item === "object" && typeof (item as IntegrationSecretReference).secretId === "string") {
        refs.push(item as IntegrationSecretReference);
      }
    }
  }

  return refs;
}
