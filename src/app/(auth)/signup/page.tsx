import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
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
