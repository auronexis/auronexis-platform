import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/signup-form";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create account",
};

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
            Set up your Operations Command Center.
          </p>
        </div>
        <SignUpForm />
        <LegalLinksInline className="mt-8 border-t border-border/60 pt-4" />
      </div>
    </div>
  );
}
