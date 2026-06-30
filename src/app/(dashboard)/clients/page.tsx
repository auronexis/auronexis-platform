import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientList } from "@/components/clients/client-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { listClientsSafe } from "@/lib/clients/queries";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { CLIENT_STATUSES } from "@/lib/clients/types";
import type { ClientStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Clients",
};

type ClientsPageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requireModuleAccess("clients");
  const session = await requireSession();
  const params = await searchParams;
  const status = CLIENT_STATUSES.includes(params.status as ClientStatus)
    ? (params.status as ClientStatus)
    : undefined;
  const search = params.q?.trim() || undefined;
  const { clients, error: loadError } = await listClientsSafe(session, { status, search });
  const canCreate = canAccessModule(session.role, "clients", "create");
  const canManage =
    canAccessModule(session.role, "clients", "update") ||
    canAccessModule(session.role, "clients", "delete");

  return (
    <>
      <PageHeader
        module="clients"
        title="Clients"
        description="Manage agency customers and monitor operational health across your portfolio."
        action={
          canCreate ? (
            <Link href="/clients/new">
              <Button>Add Client</Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={null}>
        <ClientFilters />
      </Suspense>

      {loadError ? (
        <FormAlert variant="error">
          Unable to load clients. {loadError}
        </FormAlert>
      ) : null}

      <ClientList clients={clients} canManage={canManage} />
    </>
  );
}
