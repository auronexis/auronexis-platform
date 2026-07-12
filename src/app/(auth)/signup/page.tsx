import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { redirect } from "next/navigation";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { SignUpForm } from "@/components/auth/signup-form";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { getSession } from "@/lib/auth/session";


export const metadata: Metadata = createPageMetadataForPath("/signup");

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-navy-950">Create your agency</h1>
          <p className="mt-2 text-sm text-muted">
            Create a free workspace to explore the platform, then choose a paid plan when you are ready to scale.
          </p>
        </div>
        <ConversionTracker event="signup_started" props={{ surface: "signup_page" }} />
        <SignUpForm />
        <LegalLinksInline className="mt-8 border-t border-border/60 pt-4" />
      </div>
    </div>
  );
}
