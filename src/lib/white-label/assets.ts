import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WhiteLabelAssetKind } from "@/lib/white-label/types";
import { ALLOWED_ASSET_MIME_TYPES, DEFAULT_ASSET_MAX_BYTES } from "@/lib/white-label/types";
import { sanitizeSvgBytes } from "@/lib/security/svg-sanitize";

const BUCKET = "white-label-assets";

export type UploadedAssetResult = {
  signedUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export function validateAssetUpload(input: {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}): void {
  if (!ALLOWED_ASSET_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_ASSET_MIME_TYPES)[number])) {
    throw new Error("Unsupported file type. Use PNG, SVG, ICO, or WEBP.");
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > DEFAULT_ASSET_MAX_BYTES) {
    throw new Error("File must be between 1 byte and 2 MB.");
  }

  if (input.width && input.height && (input.width > 4096 || input.height > 4096)) {
    throw new Error("Image dimensions must not exceed 4096px.");
  }
}

export async function uploadWhiteLabelAsset(input: {
  organizationId: string;
  kind: WhiteLabelAssetKind;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<UploadedAssetResult> {
  validateAssetUpload({ mimeType: input.mimeType, sizeBytes: input.bytes.length });

  const bytes =
    input.mimeType === "image/svg+xml" ? sanitizeSvgBytes(input.bytes) : input.bytes;

  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${input.organizationId}/${input.kind}.${extension}`;
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    upsert: true,
    contentType: input.mimeType,
  });

  if (error) {
    throw new Error(`Asset upload failed: ${error.message}`);
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (signError || !signed?.signedUrl) {
    throw new Error("Unable to generate signed asset URL.");
  }

  return {
    signedUrl: signed.signedUrl,
    storagePath,
    mimeType: input.mimeType,
    sizeBytes: bytes.length,
  };
}

export async function getSignedAssetUrl(
  organizationId: string,
  storagePath: string,
): Promise<string | null> {
  if (!storagePath.startsWith(`${organizationId}/`)) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

export function assetFieldForKind(kind: WhiteLabelAssetKind): string {
  const map: Record<WhiteLabelAssetKind, string> = {
    logo_light: "logo_light",
    logo_dark: "logo_dark",
    favicon: "favicon",
    login_background: "login_background",
    dashboard_background: "dashboard_background",
    portal_logo: "logo_light",
    email_logo: "logo_light",
    pdf_logo: "logo_light",
    avatar_placeholder: "logo_light",
  };
  return map[kind];
}
