import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SalesLeadForm } from "@/components/sales/sales-lead-form";
import { PageHeader } from "@/components/layout/page-header";
import { listTeamMembers } from "@/lib/team/queries";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "New Lead",
};

export default async function NewSalesLeadPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();

  if (!canAccessModule(session.role, "sales", "create")) {
    redirect("/sales/leads");
  }

  const teamMembers = await listTeamMembers(session);

  return (
    <>
      <Link
        href="/sales/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to leads
      </Link>
      <PageHeader
        module="sales"
        title="Add lead"
        description="Create a new B2B prospect in your sales pipeline."
      />
      <SalesLeadForm teamMembers={teamMembers} />
    </>
  );
}
