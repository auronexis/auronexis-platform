import type { Metadata } from "next";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { SalesSubnav } from "@/components/sales/sales-subnav";

export const metadata: Metadata = {
  title: "Sales",
};

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess("sales");

  return (
    <>
      <SalesSubnav />
      {children}
    </>
  );
}
