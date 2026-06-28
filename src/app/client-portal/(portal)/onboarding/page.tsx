import type { Metadata } from "next";
import { PortalOnboardingClient } from "@/components/client-portal/portal-onboarding-client";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { getPortalCustomerOnboarding } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = { title: "Onboarding" };

export default async function PortalOnboardingPage() {
  const session = await requireClientPortalSession();
  const [onboarding, branding] = await Promise.all([
    getPortalCustomerOnboarding(session),
    getOrganizationBrandingForOrganization(session.organization.id, session.organization.name),
  ]);

  return (
    <PortalOnboardingClient
      clientName={session.client.name}
      branding={branding}
      onboarding={onboarding}
    />
  );
}
