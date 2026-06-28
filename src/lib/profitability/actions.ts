"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canEditClientFinancials } from "@/lib/profitability/guards";
import { AuthorizationError, requirePermission } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClientFinancialInsert = Database["public"]["Tables"]["client_financials"]["Insert"];
type ClientFinancialUpdate = Database["public"]["Tables"]["client_financials"]["Update"];

export type ClientFinancialActionState = {
  error?: string;
  success?: string;
};

const financialSchema = z.object({
  monthlyRevenue: z
    .string()
    .trim()
    .transform((value) => Number(value))
    .refine((value) => !Number.isNaN(value) && value >= 0, {
      message: "Enter a valid monthly revenue amount.",
    }),
  monthlyCost: z
    .string()
    .trim()
    .transform((value) => Number(value))
    .refine((value) => !Number.isNaN(value) && value >= 0, {
      message: "Enter a valid monthly cost amount.",
    }),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (!value ? null : value)),
});

async function verifyClientInOrg(
  organizationId: string,
  clientId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .maybeSingle();

  return Boolean(data);
}

/** Create or update a client financial record — Owner/Admin only. */
export async function upsertClientFinancialAction(
  clientId: string,
  _prevState: ClientFinancialActionState,
  formData: FormData,
): Promise<ClientFinancialActionState> {
  const session = await requireSession();

  if (!canEditClientFinancials(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "profitability");

  requirePermission(session.role, "profitability", "update");

  const parsed = financialSchema.safeParse({
    monthlyRevenue: formData.get("monthlyRevenue"),
    monthlyCost: formData.get("monthlyCost"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid financial data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, clientId))) {
    return { error: "Selected client is not valid." };
  }

  const supabase = await createClient();
  const payload: ClientFinancialInsert = {
    organization_id: session.organization.id,
    client_id: clientId,
    monthly_revenue: parsed.data.monthlyRevenue,
    monthly_cost: parsed.data.monthlyCost,
    notes: parsed.data.notes,
  };

  const { error } = await supabase
    .from("client_financials")
    .upsert(payload as never, { onConflict: "client_id" });

  if (error) {
    return { error: "Unable to save client financials." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "financial",
    entityId: clientId,
    action: "updated",
    title: "Client financials updated",
    description: `Revenue ${parsed.data.monthlyRevenue}, cost ${parsed.data.monthlyCost}`,
    metadata: { clientId, monthlyRevenue: parsed.data.monthlyRevenue, monthlyCost: parsed.data.monthlyCost },
  });

  revalidatePath("/profitability");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: "Financials saved." };
}

/** Update an existing financial record by id — Owner/Admin only. */
export async function updateClientFinancialAction(
  financialId: string,
  clientId: string,
  _prevState: ClientFinancialActionState,
  formData: FormData,
): Promise<ClientFinancialActionState> {
  const session = await requireSession();

  if (!canEditClientFinancials(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "profitability");

  requirePermission(session.role, "profitability", "update");

  const parsed = financialSchema.safeParse({
    monthlyRevenue: formData.get("monthlyRevenue"),
    monthlyCost: formData.get("monthlyCost"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid financial data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, clientId))) {
    return { error: "Selected client is not valid." };
  }

  const supabase = await createClient();
  const updatePayload: ClientFinancialUpdate = {
    monthly_revenue: parsed.data.monthlyRevenue,
    monthly_cost: parsed.data.monthlyCost,
    notes: parsed.data.notes,
  };

  const { error } = await supabase
    .from("client_financials")
    .update(updatePayload as never)
    .eq("id", financialId)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId);

  if (error) {
    return { error: "Unable to save client financials." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "financial",
    entityId: clientId,
    action: "updated",
    title: "Client financials updated",
    description: `Revenue ${parsed.data.monthlyRevenue}, cost ${parsed.data.monthlyCost}`,
    metadata: { clientId, financialId, monthlyRevenue: parsed.data.monthlyRevenue, monthlyCost: parsed.data.monthlyCost },
  });

  revalidatePath("/profitability");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: "Financials saved." };
}
