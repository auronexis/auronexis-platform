import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Billing test",
  robots: { index: false, follow: false },
};

/** FastSpring test checkout UI is retired — Mollie test surface replaces it. */
export default function RetiredFastSpringTestCheckoutPage() {
  redirect("/settings/billing/mollie-test");
}
