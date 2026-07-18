import type { Metadata } from "next";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Account");

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
