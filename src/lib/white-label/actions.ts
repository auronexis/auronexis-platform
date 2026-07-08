"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { normalizeHexColor } from "@/lib/branding/defaults";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureSafe } from "@/lib/action-errors";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import { assetFieldForKind, uploadWhiteLabelAsset } from "@/lib/white-label/assets";
import { invalidateWhiteLabelCache } from "@/lib/white-label/cache";
import { validateCustomDomain } from "@/lib/white-label/domains";
import { getWhiteLabelSettingsRecord } from "@/lib/white-label/queries";
import type { WhiteLabelAssetKind } from "@/lib/white-label/types";
import {
  isValidEmail,
  isValidHttpsUrl,
  sanitizeCustomCss,
} from "@/lib/white-label/validation";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Database } from "@/types/database";

type WhiteLabelAccess =
  | { ok: true; session: SessionContext }
  | { ok: false; error: string };

type WhiteLabelInsert = Database["public"]["Tables"]["white_label_settings"]["Insert"];
type WhiteLabelUpdate = Database["public"]["Tables"]["white_label_settings"]["Update"];

export type WhiteLabelActionState = {
  error?: string;
  success?: string;
  plaintextAssetUrl?: string;
};

const hex = z.string().trim().transform((value) => normalizeHexColor(value, value));

const settingsSchema = z.object({
  companyName: z.string().trim().min(2),
  platformName: z.string().trim().optional().nullable(),
  primaryColor: hex,
  secondaryColor: hex,
  accentColor: hex,
  successColor: hex,
  warningColor: hex,
  dangerColor: hex,
  supportEmail: z.string().trim().optional().nullable(),
  supportUrl: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  privacyUrl: z.string().trim().optional().nullable(),
  termsUrl: z.string().trim().optional().nullable(),
  customCss: z.string().optional().nullable(),
  customDomain: z.string().trim().optional().nullable(),
  emailSenderName: z.string().trim().optional().nullable(),
  emailSenderAddress: z.string().trim().optional().nullable(),
  portalTitle: z.string().trim().optional().nullable(),
  portalDescription: z.string().trim().optional().nullable(),
  portalWelcomeMessage: z.string().trim().optional().nullable(),
  loginTitle: z.string().trim().optional().nullable(),
  loginSubtitle: z.string().trim().optional().nullable(),
  loginWelcomeMessage: z.string().trim().optional().nullable(),
  pdfFooter: z.string().trim().optional().nullable(),
});

async function ensureAccess(): Promise<WhiteLabelAccess> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { ok: false, error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "white_label");
  if (planError) {
    return { ok: false, error: planError.error };
  }

  return { ok: true, session };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveWhiteLabelSettingsAction(
  _prev: WhiteLabelActionState,
  formData: FormData,
): Promise<WhiteLabelActionState> {
  try {
    const access = await ensureAccess();
    if (!access.ok) {
      return { error: access.error };
    }
    const session = access.session;
    const parsed = settingsSchema.safeParse({
      companyName: formData.get("companyName"),
      platformName: formData.get("platformName"),
      primaryColor: formData.get("primaryColor"),
      secondaryColor: formData.get("secondaryColor"),
      accentColor: formData.get("accentColor"),
      successColor: formData.get("successColor"),
      warningColor: formData.get("warningColor"),
      dangerColor: formData.get("dangerColor"),
      supportEmail: formData.get("supportEmail"),
      supportUrl: formData.get("supportUrl"),
      website: formData.get("website"),
      privacyUrl: formData.get("privacyUrl"),
      termsUrl: formData.get("termsUrl"),
      customCss: formData.get("customCss"),
      customDomain: formData.get("customDomain"),
      emailSenderName: formData.get("emailSenderName"),
      emailSenderAddress: formData.get("emailSenderAddress"),
      portalTitle: formData.get("portalTitle"),
      portalDescription: formData.get("portalDescription"),
      portalWelcomeMessage: formData.get("portalWelcomeMessage"),
      loginTitle: formData.get("loginTitle"),
      loginSubtitle: formData.get("loginSubtitle"),
      loginWelcomeMessage: formData.get("loginWelcomeMessage"),
      pdfFooter: formData.get("pdfFooter"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid white label settings." };
    }

    const supportEmail = emptyToNull(parsed.data.supportEmail);
    const supportUrl = emptyToNull(parsed.data.supportUrl);
    const website = emptyToNull(parsed.data.website);
    const privacyUrl = emptyToNull(parsed.data.privacyUrl);
    const termsUrl = emptyToNull(parsed.data.termsUrl);
    const emailSenderAddress = emptyToNull(parsed.data.emailSenderAddress);

    if (supportEmail && !isValidEmail(supportEmail)) {
      return { error: "Enter a valid support email." };
    }
    for (const url of [supportUrl, website, privacyUrl, termsUrl]) {
      if (url && !isValidHttpsUrl(url)) {
        return { error: "URLs must be valid http(s) addresses." };
      }
    }
    if (emailSenderAddress && !isValidEmail(emailSenderAddress)) {
      return { error: "Enter a valid sender email address." };
    }

    let customCss: string | null = null;
    try {
      customCss = sanitizeCustomCss(emptyToNull(parsed.data.customCss));
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid custom CSS." };
    }

    let customDomain: string | null = null;
    try {
      customDomain = parsed.data.customDomain ? validateCustomDomain(parsed.data.customDomain) : null;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid custom domain." };
    }

    const payload = {
      company_name: parsed.data.companyName,
      platform_name: emptyToNull(parsed.data.platformName),
      primary_color: parsed.data.primaryColor,
      secondary_color: parsed.data.secondaryColor,
      accent_color: parsed.data.accentColor,
      success_color: parsed.data.successColor,
      warning_color: parsed.data.warningColor,
      danger_color: parsed.data.dangerColor,
      support_email: supportEmail,
      support_url: supportUrl,
      website,
      privacy_url: privacyUrl,
      terms_url: termsUrl,
      custom_css: customCss,
      custom_domain: customDomain,
      domain_verification_status: customDomain ? "pending" : "not_configured",
      domain_ssl_status: customDomain ? "pending" : "not_configured",
      email_sender_name: emptyToNull(parsed.data.emailSenderName),
      email_sender_address: emailSenderAddress,
      portal_title: emptyToNull(parsed.data.portalTitle),
      portal_description: emptyToNull(parsed.data.portalDescription),
      portal_welcome_message: emptyToNull(parsed.data.portalWelcomeMessage),
      login_title: emptyToNull(parsed.data.loginTitle),
      login_subtitle: emptyToNull(parsed.data.loginSubtitle),
      login_welcome_message: emptyToNull(parsed.data.loginWelcomeMessage),
      pdf_footer: emptyToNull(parsed.data.pdfFooter),
      updated_by: session.user.id,
    };

    const existing = await getWhiteLabelSettingsRecord(session.organization.id);
    const supabase = await createClient();

    if (existing) {
      const { error } = await supabase
        .from("white_label_settings")
        .update(payload as WhiteLabelUpdate as never)
        .eq("organization_id", session.organization.id);
      if (error) return { error: "Unable to save white label settings." };
    } else {
      const { error } = await supabase.from("white_label_settings").insert({
        organization_id: session.organization.id,
        ...payload,
      } as WhiteLabelInsert as never);
      if (error) return { error: "Unable to save white label settings." };
    }

    await syncLegacyBranding(session.organization.id, parsed.data);
    invalidateWhiteLabelCache(session.organization.id);
    revalidateWhiteLabelPaths();

    return { success: "White label settings saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save settings." };
  }
}

export async function publishWhiteLabelSettingsAction(): Promise<WhiteLabelActionState> {
  try {
    const access = await ensureAccess();
    if (!access.ok) {
      return { error: access.error };
    }
    const session = access.session;
    const supabase = await createClient();
    const { error } = await supabase
      .from("white_label_settings")
      .update({ published_at: new Date().toISOString(), updated_by: session.user.id } as never)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { error: "Unable to publish white label settings." };
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: session.organization.id,
      action: "white_label_published",
      title: "White label branding published",
    });

    invalidateWhiteLabelCache(session.organization.id);
    revalidateWhiteLabelPaths();
    return { success: "White label branding published." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to publish." };
  }
}

export async function resetWhiteLabelSettingsAction(): Promise<WhiteLabelActionState> {
  try {
    const access = await ensureAccess();
    if (!access.ok) {
      return { error: access.error };
    }
    const session = access.session;
    const supabase = await createClient();
    await supabase.from("white_label_settings").delete().eq("organization_id", session.organization.id);
    invalidateWhiteLabelCache(session.organization.id);
    revalidateWhiteLabelPaths();
    return { success: "White label settings reset to platform defaults." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to reset." };
  }
}

export async function uploadWhiteLabelAssetAction(input: {
  kind: WhiteLabelAssetKind;
  fileName: string;
  mimeType: string;
  base64Data: string;
}): Promise<WhiteLabelActionState> {
  try {
    const access = await ensureAccess();
    if (!access.ok) {
      return { error: access.error };
    }
    const session = access.session;
    const bytes = Buffer.from(input.base64Data, "base64");
    const uploaded = await uploadWhiteLabelAsset({
      organizationId: session.organization.id,
      kind: input.kind,
      fileName: input.fileName,
      mimeType: input.mimeType,
      bytes,
    });

    const field = assetFieldForKind(input.kind);
    const supabase = await createClient();
    const existing = await getWhiteLabelSettingsRecord(session.organization.id);

    if (existing) {
      await supabase
        .from("white_label_settings")
        .update({ [field]: uploaded.signedUrl, updated_by: session.user.id } as never)
        .eq("organization_id", session.organization.id);
    } else {
      await supabase.from("white_label_settings").insert({
        organization_id: session.organization.id,
        company_name: session.organization.name,
        [field]: uploaded.signedUrl,
        updated_by: session.user.id,
      } as never);
    }

    invalidateWhiteLabelCache(session.organization.id);
    revalidateWhiteLabelPaths();
    return { success: "Asset uploaded.", plaintextAssetUrl: uploaded.signedUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Asset upload failed." };
  }
}

async function syncLegacyBranding(
  organizationId: string,
  data: z.infer<typeof settingsSchema>,
): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("organization_branding")
    .select("id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const legacyPayload = {
    company_name: data.companyName,
    primary_color: data.primaryColor,
    secondary_color: data.secondaryColor,
    portal_welcome_message: emptyToNull(data.portalWelcomeMessage),
  };

  if (existing) {
    await supabase
      .from("organization_branding")
      .update(legacyPayload as never)
      .eq("organization_id", organizationId);
  } else {
    await supabase.from("organization_branding").insert({
      organization_id: organizationId,
      ...legacyPayload,
    } as never);
  }
}

function revalidateWhiteLabelPaths(): void {
  revalidatePath("/settings/branding");
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/login");
  revalidatePath("/client-portal", "layout");
}
