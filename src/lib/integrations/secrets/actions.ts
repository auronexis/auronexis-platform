"use server";

import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { requireSession } from "@/lib/auth/session";
import {
  createSecret,
  deleteSecret,
  listSecretReferences,
  rotateSecret,
} from "@/lib/integrations/secrets/repository";
import type {
  CreateIntegrationSecretInput,
  IntegrationSecretReferenceView,
  RotateIntegrationSecretInput,
} from "@/lib/integrations/secrets/types";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ensureSecretsAccess() {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
  if (!access.allowed) {
    throw new Error(access.message ?? "Automation builder is required to manage integration secrets.");
  }
  return session;
}

function toActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export async function listIntegrationSecretsAction(): Promise<
  ActionResult<IntegrationSecretReferenceView[]>
> {
  try {
    const session = await ensureSecretsAccess();
    const data = await listSecretReferences(session);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function createIntegrationSecretAction(
  input: CreateIntegrationSecretInput,
): Promise<ActionResult<IntegrationSecretReferenceView>> {
  try {
    const session = await ensureSecretsAccess();
    const data = await createSecret(session, input);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function rotateIntegrationSecretAction(
  input: RotateIntegrationSecretInput,
): Promise<ActionResult<IntegrationSecretReferenceView>> {
  try {
    const session = await ensureSecretsAccess();
    const data = await rotateSecret(session, input);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function deleteIntegrationSecretAction(
  secretId: string,
): Promise<ActionResult<null>> {
  try {
    const session = await ensureSecretsAccess();
    await deleteSecret(session, secretId);
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
