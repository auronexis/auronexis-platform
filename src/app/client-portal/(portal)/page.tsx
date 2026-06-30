import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Client Portal",
};

export default function ClientPortalRootPage() {
  redirect("/client-portal/overview");
}
