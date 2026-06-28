import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { SeatLimitWarning } from "@/components/seats/seat-limit-warning";
import { PageHeader } from "@/components/layout/page-header";
import { createClientAction } from "@/lib/clients/actions";
import { requireSession } from "@/lib/auth/session";
import { getClientCreateCheckForSession } from "@/lib/plans/guards";
import { canAccessModule, canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Add client",
};

export default async function NewClientPage() {
  await requireModuleAccess("clients");
  const session = await requireSession();

  if (!canAccessModule(session.role, "clients", "create")) {
    redirect("/clients");
  }

  const clientLimitCheck = await getClientCreateCheckForSession(session);

  return (
    <>
      <PageHeader
        title="Add client"
        description="Create a new agency customer record."
        action={
          <Link href="/clients" className="text-sm font-medium text-accent-blue hover:underline">
            Back to clients
          </Link>
        }
      />

      {!clientLimitCheck.allowed ? (
        <div className="mb-4 max-w-3xl">
          <SeatLimitWarning message={clientLimitCheck.message} />
        </div>
      ) : null}

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <ClientForm
          action={createClientAction}
          showRevenue={canViewRevenue(session.role)}
          submitLabel="Create client"
          pendingLabel="Creating…"
          disabled={!clientLimitCheck.allowed}
        />
      </div>
    </>
  );
}
