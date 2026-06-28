import type { Metadata } from "next";
import Link from "next/link";
import { ClientList } from "@/components/clients/client-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/clients/queries";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule, canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Clients",
};

type ClientsPageProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requireModuleAccess("clients");
  const session = await requireSession();
  const params = await searchParams;
  const includeArchived = params.archived === "1";
  const clients = await listClients(session, { includeArchived });
  const showRevenue = canViewRevenue(session.role);
  const canCreate = canAccessModule(session.role, "clients", "create");

  return (
    <>
      <PageHeader
        module="clients"
        title="Clients"
        description="Manage agency customers and monitor operational health across your portfolio."
        action={
          canCreate ? (
            <Link href="/clients/new">
              <Button>Add client</Button>
            </Link>
          ) : undefined
        }
      />

      <ArchiveFilterTabs
        tabs={[
          { label: "Active clients", href: "/clients", active: !includeArchived },
          { label: "Include archived", href: "/clients?archived=1", active: includeArchived },
        ]}
      />

      <ClientList clients={clients} showRevenue={showRevenue} />
    </>
  );
}
