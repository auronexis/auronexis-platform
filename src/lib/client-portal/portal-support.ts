import "server-only";

import type { ClientPortalSessionContext, PortalContactsData } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";

/** Portal contacts and support details — never throws. */
export async function getPortalContacts(
  session: ClientPortalSessionContext,
  supportEmail: string | null,
): Promise<PortalContactsData> {
  try {
    let accountOwnerName: string | null = null;

    if (session.client.owner_id) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", session.client.owner_id)
        .eq("organization_id", session.organization.id)
        .maybeSingle();

      accountOwnerName = (data as { full_name: string } | null)?.full_name ?? null;
    }

    return {
      contactName: session.client.contact_name,
      contactEmail: session.client.contact_email,
      accountOwnerName,
      supportEmail,
    };
  } catch {
    return {
      contactName: session.client.contact_name,
      contactEmail: session.client.contact_email,
      accountOwnerName: null,
      supportEmail,
    };
  }
}

export type PortalSupportData = PortalContactsData & {
  clientName: string;
};

/** Portal support placeholder data — never throws. */
export async function getPortalSupport(
  session: ClientPortalSessionContext,
  supportEmail: string | null,
): Promise<PortalSupportData> {
  const contacts = await getPortalContacts(session, supportEmail);
  return {
    ...contacts,
    clientName: session.client.name,
  };
}
