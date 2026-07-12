import type { Metadata } from "next";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { SalesSubnav } from "@/components/sales/sales-subnav";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Sales");

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess("sales");

  return (
    <>
      <SalesSubnav />
      {children}
    </>
  );
}
