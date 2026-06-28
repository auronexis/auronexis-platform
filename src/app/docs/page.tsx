import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Bot,
  CreditCard,
  FileText,
  Palette,
  Plug,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { COMPANY_NAME, DOCS_URL } from "@/lib/company/contact";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";
import { getAuroraModule, auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Documentation",
  description: `${COMPANY_NAME} product documentation`,
};

const DOC_CARDS = [
  { slug: "getting-started", title: "Getting Started", description: "Sign up, onboarding, and first workspace setup.", icon: BookOpen, module: "dashboard" as const },
  { slug: "clients", title: "Clients", description: "Manage client portfolio, health, and revenue.", icon: Users, module: "clients" as const },
  { slug: "reports", title: "Reports", description: "Templates, schedules, publish workflow, and portal delivery.", icon: FileText, module: "reports" as const },
  { slug: "automation", title: "Automation", description: "Workflow builder, triggers, and execution history.", icon: Workflow, module: "workflows" as const },
  { slug: "integrations", title: "Integrations", description: "Connectors, OAuth, sync, and runtime delivery.", icon: Plug, module: "workflows" as const },
  { slug: "billing", title: "Billing", description: "Plans, Stripe checkout, invoices, and usage.", icon: CreditCard, module: "settings" as const },
  { slug: "api", title: "API", description: "Public API keys, scopes, and OpenAPI reference.", icon: Bot, module: "settings" as const, href: "/api/docs" },
  { slug: "compliance", title: "Compliance", description: "Audit, GDPR, retention, and security incidents.", icon: Shield, module: "settings" as const },
  { slug: "white-label", title: "White Label", description: "Branding, portal, email, and PDF customization.", icon: Palette, module: "settings" as const },
  { slug: "predictive", title: "Predictive Intelligence", description: "Forecasts, health scores, and risk signals.", icon: Sparkles, module: "dashboard" as const },
] as const;

export default function DocsHubPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BRANDING_ASSETS.heroBanner})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/85 to-secondary/50"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-10 sm:py-12">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{COMPANY_NAME} Docs</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">
              In-app documentation hub. Full docs also at{" "}
              <a href={DOCS_URL} className="underline hover:text-white" target="_blank" rel="noopener noreferrer">
                {DOCS_URL.replace("https://", "")}
              </a>
              .
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            App
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_CARDS.map((card) => {
            const identity = getAuroraModule(card.module);
            const href = "href" in card ? card.href : `/docs/${card.slug}`;

            return (
              <Link
                key={card.slug}
                href={href}
                className={cn(
                  auroraSurfaceInteractive,
                  "block rounded-2xl border border-white/10 bg-white/[0.03] p-5",
                  focusRing,
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border",
                    identity.iconContainer,
                  )}
                >
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-semibold text-white">{card.title}</h2>
                <p className="mt-2 text-sm text-primary-foreground/75">{card.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
            Usage & analytics
          </div>
          <p className="mt-2 text-sm text-primary-foreground/75">
            Detailed guides for each module are being published to {DOCS_URL}. Use Settings → Diagnostics for
            environment and readiness checks in your workspace.
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
