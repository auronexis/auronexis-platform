import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FastSpringTestCheckoutPanel } from "@/components/settings/fastspring-test-checkout-panel";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { FASTSPRING_PRODUCT_CATALOG } from "@/lib/fastspring/products";
import { isFastSpringStoreConfigured } from "@/lib/fastspring/test-checkout";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "FastSpring Test Checkout",
};

export default async function FastSpringTestCheckoutPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-primary hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings/billing" className="font-medium text-primary hover:underline">
          Billing
        </Link>
        <span className="mx-2">/</span>
        <span>FastSpring test</span>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Internal · TEST MODE"
        title="FastSpring Test Checkout"
        description="Launch an isolated FastSpring test purchase to verify webhook → Supabase subscription sync. Public checkout remains on Paddle."
      />

      <FastSpringTestCheckoutPanel
        catalog={[...FASTSPRING_PRODUCT_CATALOG]}
        storeConfigured={isFastSpringStoreConfigured()}
      />
    </>
  );
}
