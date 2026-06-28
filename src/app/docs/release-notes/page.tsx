import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { COMPANY_NAME } from "@/lib/company/contact";

export const metadata: Metadata = {
  title: "Release Notes",
};

const RELEASES = [
  {
    version: "v0.975",
    date: "June 2025",
    highlights: ["Launch polish", "Legal pages", "Help center", "Status and docs hub"],
  },
  {
    version: "v0.97",
    date: "June 2025",
    highlights: ["Staging rollout", "Sentry and PostHog", "Demo workspace expansion"],
  },
  {
    version: "v0.96",
    date: "June 2025",
    highlights: ["Pilot deployment docs", "Health endpoint", "Pilot program foundation"],
  },
];

export default function ReleaseNotesPage() {
  return (
    <MarketingShell>
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-8">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Release Notes</h1>
            <p className="text-sm text-primary-foreground/75">{COMPANY_NAME} platform updates</p>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-white hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Docs
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
        {RELEASES.map((release) => (
          <section key={release.version} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">{release.version}</h2>
              <span className="text-sm text-primary-foreground/70">{release.date}</span>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-primary-foreground/75">
              {release.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </MarketingShell>
  );
}
