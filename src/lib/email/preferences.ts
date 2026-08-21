import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailCategory } from "@/lib/email/categories";
import { isTransactionalRequiredCategory } from "@/lib/email/categories";

/** Marketing preference channels — opt-in only; never auto-subscribed at signup. */
export type MarketingEmailChannel = "product_updates" | "newsletter" | "promotions";

export type UserEmailPreferencesRecord = {
  user_id: string;
  organization_id: string;
  product_updates: boolean;
  newsletter: boolean;
  promotions: boolean;
  marketing_unsubscribed_at: string | null;
  updated_at: string;
};

export type UserEmailPreferences = {
  /** Always true — security/account/billing system mail cannot be disabled. */
  transactionalRequired: true;
  productUpdates: boolean;
  newsletter: boolean;
  promotions: boolean;
  marketingUnsubscribedAt: string | null;
};

export function createDefaultEmailPreferences(): UserEmailPreferences {
  return {
    transactionalRequired: true,
    productUpdates: false,
    newsletter: false,
    promotions: false,
    marketingUnsubscribedAt: null,
  };
}

export function mapEmailPreferencesRow(
  row: UserEmailPreferencesRecord | null,
): UserEmailPreferences {
  if (!row) {
    return createDefaultEmailPreferences();
  }

  return {
    transactionalRequired: true,
    productUpdates: row.product_updates,
    newsletter: row.newsletter,
    promotions: row.promotions,
    marketingUnsubscribedAt: row.marketing_unsubscribed_at,
  };
}

/** Transactional categories always send; marketing requires explicit opt-in and no global unsubscribe. */
export function canSendEmailForPreferences(
  category: EmailCategory | MarketingEmailChannel,
  preferences: UserEmailPreferences,
): boolean {
  if (category === "product_updates" || category === "newsletter" || category === "promotions") {
    if (preferences.marketingUnsubscribedAt) {
      return false;
    }
    if (category === "product_updates") return preferences.productUpdates;
    if (category === "newsletter") return preferences.newsletter;
    return preferences.promotions;
  }

  return isTransactionalRequiredCategory(category);
}

export async function getUserEmailPreferences(userId: string): Promise<UserEmailPreferences> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_email_preferences")
    .select(
      "user_id, organization_id, product_updates, newsletter, promotions, marketing_unsubscribed_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return createDefaultEmailPreferences();
  }

  return mapEmailPreferencesRow(data as UserEmailPreferencesRecord);
}

export async function upsertUserEmailPreferences(input: {
  userId: string;
  organizationId: string;
  productUpdates: boolean;
  newsletter: boolean;
  promotions: boolean;
  marketingUnsubscribed?: boolean;
}): Promise<UserEmailPreferences> {
  const admin = createAdminClient();
  const marketingUnsubscribedAt = input.marketingUnsubscribed ? new Date().toISOString() : null;

  const { data, error } = await admin
    .from("user_email_preferences")
    .upsert(
      {
        user_id: input.userId,
        organization_id: input.organizationId,
        product_updates: input.productUpdates,
        newsletter: input.newsletter,
        promotions: input.promotions,
        marketing_unsubscribed_at: marketingUnsubscribedAt,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id" },
    )
    .select(
      "user_id, organization_id, product_updates, newsletter, promotions, marketing_unsubscribed_at, updated_at",
    )
    .single();

  if (error || !data) {
    return {
      transactionalRequired: true,
      productUpdates: input.productUpdates,
      newsletter: input.newsletter,
      promotions: input.promotions,
      marketingUnsubscribedAt,
    };
  }

  return mapEmailPreferencesRow(data as UserEmailPreferencesRecord);
}
