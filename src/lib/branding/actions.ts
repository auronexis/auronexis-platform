"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { normalizeHexColor } from "@/lib/branding/defaults";
import { getOrganizationBrandingRecord } from "@/lib/branding/queries";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { AuthorizationError } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrganizationBrandingInsert = Database["public"]["Tables"]["organization_branding"]["Insert"];
type OrganizationBrandingUpdate = Database["public"]["Tables"]["organization_branding"]["Update"];

export type BrandingActionState = {
  error?: string;
  success?: string;
};

const hexColorSchema = z
  .string()
  .trim()
  .transform((value) => normalizeHexColor(value, value))
  .refine((value) => /^#[0-9A-F]{6}$/.test(value), {
    message: "Enter a valid hex color (e.g. #2563EB).",
  });

const brandingSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  logoUrl: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .refine((value) => value === null || value === undefined || z.string().url().safeParse(value).success, {
      message: "Enter a valid logo URL.",
    }),
  portalWelcomeMessage: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

/** Create or update organization branding — Owner/Admin only. */
export async function upsertOrganizationBrandingAction(
  _prevState: BrandingActionState,
  formData: FormData,
): Promise<BrandingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "white_label");

  const parsed = brandingSchema.safeParse({
    companyName: formData.get("companyName"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    logoUrl: formData.get("logoUrl"),
    portalWelcomeMessage: formData.get("portalWelcomeMessage"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid branding data." };
  }

  const existing = await getOrganizationBrandingRecord(session.organization.id);
  const supabase = await createClient();

  const payload = {
    company_name: parsed.data.companyName,
    primary_color: parsed.data.primaryColor,
    secondary_color: parsed.data.secondaryColor,
    logo_url: parsed.data.logoUrl ?? null,
    portal_welcome_message: parsed.data.portalWelcomeMessage ?? null,
  };

  if (existing) {
    const updatePayload: OrganizationBrandingUpdate = payload;
    const { error } = await supabase
      .from("organization_branding")
      .update(updatePayload as never)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { error: "Unable to update branding." };
    }
  } else {
    const insertPayload: OrganizationBrandingInsert = {
      organization_id: session.organization.id,
      ...payload,
    };

    const { error } = await supabase
      .from("organization_branding")
      .insert(insertPayload as never);

    if (error) {
      return { error: "Unable to save branding." };
    }
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "branding_updated",
    title: `Branding updated: ${parsed.data.companyName}`,
    metadata: {
      companyName: parsed.data.companyName,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      hasLogo: Boolean(parsed.data.logoUrl),
    },
  });

  revalidatePath("/settings/branding");
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/client-portal", "layout");

  return { success: "Branding saved." };
}
