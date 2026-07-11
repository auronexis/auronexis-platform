import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { getClientById } from "@/lib/clients/queries";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { buildClientSuccessSnapshot } from "@/lib/customer-success/snapshot";
import {
  canCompleteCustomerSuccess,
  canWriteCustomerSuccess,
} from "@/lib/customer-success/guards";
import { ClientSuccessWorkspace } from "@/components/customer-success/client-success-workspace";
import { CustomerSuccessTracker } from "@/components/customer-success/customer-success-tracker";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await requireSession();
  const client = await getClientById(session, id);
  return { title: client ? `${client.name} — Success` : "Client Success" };
}

export default async function ClientSuccessPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();

  if (!sessionHasPermission(session, "customer_success.read")) {
    return (
      <PageSurface>
        <p className="text-sm text-muted">You do not have permission to view client success.</p>
      </PageSurface>
    );
  }

  const client = await getClientById(session, id);
  if (!client) notFound();

  const planContext = await getOrganizationPlanContextForSession(session).catch(() => null);
  const snapshot = await buildClientSuccessSnapshot({
    session,
    clientId: id,
    planContext,
  });

  if (!snapshot) notFound();

  return (
    <>
      <PageHeader
        title={`${client.name} — Success`}
        description="Client health, playbooks, tasks, and recovery."
      />
      <CustomerSuccessTracker
        event="client_success_viewed"
        organizationId={session.organization.id}
        extra={{ client_id_hash: id.slice(0, 8) }}
      />
      <PageSurface>
        <ClientSuccessWorkspace
          snapshot={snapshot}
          canManage={canWriteCustomerSuccess(session)}
          canComplete={canCompleteCustomerSuccess(session)}
        />
      </PageSurface>
    </>
  );
}
