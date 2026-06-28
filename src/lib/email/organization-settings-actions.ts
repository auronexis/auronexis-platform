"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getOrganizationEmailSettings } from "@/lib/email/organization-settings-queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { AuthorizationError } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrganizationEmailSettingsInsert =
  Database["public"]["Tables"]["organization_email_settings"]["Insert"];
type OrganizationEmailSettingsUpdate =
  Database["public"]["Tables"]["organization_email_settings"]["Update"];

export type EmailSettingsActionState = {
  error?: string;
  success?: string;
};

const emailSettingsSchema = z.object({
  fromName: z.string().trim().min(2, "Sender name is required."),
  fromEmail: z.string().trim().email("Enter a valid sender email."),
  replyTo: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .refine((value) => value === null || value === undefined || z.string().email().safeParse(value).success, {
      message: "Enter a valid reply-to email.",
    }),
});

/** Create or update organization email sender settings — Owner/Admin only. */
export async function upsertOrganizationEmailSettingsAction(
  _prevState: EmailSettingsActionState,
  formData: FormData,
): Promise<EmailSettingsActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "email_delivery");

  const parsed = emailSettingsSchema.safeParse({
    fromName: formData.get("fromName"),
    fromEmail: formData.get("fromEmail"),
    replyTo: formData.get("replyTo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email settings." };
  }

  const existing = await getOrganizationEmailSettings(session);
  const supabase = await createClient();

  if (existing) {
    const updatePayload: OrganizationEmailSettingsUpdate = {
      from_name: parsed.data.fromName,
      from_email: parsed.data.fromEmail.toLowerCase(),
      reply_to: parsed.data.replyTo ?? null,
    };

    const { error } = await supabase
      .from("organization_email_settings")
      .update(updatePayload as never)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { error: "Unable to update email settings." };
    }
  } else {
    const insertPayload: OrganizationEmailSettingsInsert = {
      organization_id: session.organization.id,
      from_name: parsed.data.fromName,
      from_email: parsed.data.fromEmail.toLowerCase(),
      reply_to: parsed.data.replyTo ?? null,
    };

    const { error } = await supabase
      .from("organization_email_settings")
      .insert(insertPayload as never);

    if (error) {
      return { error: "Unable to save email settings." };
    }
  }

  revalidatePath("/settings/email");
  return { success: "Email settings saved." };
}
