/**
 * Organization billing identity — legal name, address, VAT ID, country.
 * Server-only persistence helpers; UI collects fields separately.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeVatId } from "@/lib/billing/vies";

export type OrganizationBillingIdentity = {
  organizationId: string;
  legalName: string | null;
  billingEmail: string | null;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  vatId: string | null;
  vatIdNormalized: string | null;
  viesStatus: string | null;
  viesCheckedAt: string | null;
  updatedAt: string;
};

export type UpsertBillingIdentityInput = {
  organizationId: string;
  legalName?: string | null;
  billingEmail?: string | null;
  countryCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  vatId?: string | null;
  viesStatus?: string | null;
  viesCheckedAt?: string | null;
};

function mapRow(row: Record<string, unknown>): OrganizationBillingIdentity {
  return {
    organizationId: String(row.organization_id),
    legalName: (row.legal_name as string | null) ?? null,
    billingEmail: (row.billing_email as string | null) ?? null,
    countryCode: (row.country_code as string | null) ?? null,
    addressLine1: (row.address_line1 as string | null) ?? null,
    addressLine2: (row.address_line2 as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    vatId: (row.vat_id as string | null) ?? null,
    vatIdNormalized: (row.vat_id_normalized as string | null) ?? null,
    viesStatus: (row.vies_status as string | null) ?? null,
    viesCheckedAt: (row.vies_checked_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

export async function getOrganizationBillingIdentity(
  organizationId: string,
): Promise<OrganizationBillingIdentity | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_billing_identities")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load billing identity: ${error.message}`);
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function upsertOrganizationBillingIdentity(
  input: UpsertBillingIdentityInput,
): Promise<OrganizationBillingIdentity> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const vatNormalized = normalizeVatId(input.vatId ?? null);

  const payload = {
    organization_id: input.organizationId,
    legal_name: input.legalName ?? null,
    billing_email: input.billingEmail ?? null,
    country_code: input.countryCode ? input.countryCode.trim().toUpperCase() : null,
    address_line1: input.addressLine1 ?? null,
    address_line2: input.addressLine2 ?? null,
    postal_code: input.postalCode ?? null,
    city: input.city ?? null,
    vat_id: input.vatId?.trim() || null,
    vat_id_normalized: vatNormalized,
    vies_status: input.viesStatus ?? null,
    vies_checked_at: input.viesCheckedAt ?? null,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("organization_billing_identities")
    .upsert(payload as never, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert billing identity: ${error?.message ?? "unknown"}`);
  }

  return mapRow(data as Record<string, unknown>);
}
