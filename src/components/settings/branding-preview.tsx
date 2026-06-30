import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { BrandLogo } from "@/components/branding/brand-logo";

type BrandingPreviewProps = {
  branding: ResolvedOrganizationBranding;
};

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <PreviewCard title="Agency Dashboard Preview">
        <div
          className="rounded-md p-4 text-white"
          style={{ backgroundColor: branding.secondaryColor }}
        >
          <div className="flex items-center gap-3">
            <BrandLogo branding={branding} size="sm" variant="light" />
            <div>
              <p className="text-sm font-semibold">{branding.companyName}</p>
              <p className="text-xs text-white/70">Operations Command Center</p>
            </div>
          </div>
        </div>
      </PreviewCard>

      <PreviewCard title="Customer Portal Preview">
        <div
          className="overflow-hidden rounded-md border border-border"
          style={{ backgroundColor: branding.secondaryColor }}
        >
          <div className="flex items-center gap-3 px-4 py-3 text-white">
            <BrandLogo branding={branding} size="sm" variant="light" />
            <div>
              <p className="text-sm font-semibold">{branding.companyName}</p>
              <p className="text-xs text-blue-200/80">Client Portal</p>
            </div>
          </div>
          <div className="bg-surface-2 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Welcome message
            </p>
            <p className="mt-1 text-sm text-secondary">{branding.portalWelcomeMessage}</p>
          </div>
          <div className="border-t border-white/10 px-4 py-2 text-[10px] text-muted">
            Powered by {PLATFORM_NAME}
          </div>
        </div>
      </PreviewCard>

      <PreviewCard title="PDF Preview">
        <div className="overflow-hidden rounded-md border border-border bg-surface-1">
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: branding.secondaryColor }}
          >
            <BrandLogo branding={branding} size="sm" variant="light" />
            <div>
              <p className="text-xs font-bold tracking-wide">{branding.companyName.toUpperCase()}</p>
              <p className="text-[10px] text-white/70">Client Operations Report</p>
            </div>
          </div>
          <div className="relative px-4 py-8">
            <p
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-bold opacity-[0.06]"
              style={{ color: branding.secondaryColor }}
            >
              {branding.companyName.toUpperCase()}
            </p>
            <div className="relative space-y-2">
              <div className="h-2 w-2/3 rounded bg-muted/20" />
              <div className="h-2 w-full rounded bg-muted/10" />
              <div className="h-2 w-5/6 rounded bg-muted/10" />
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 text-[10px] text-muted">
            Powered by {PLATFORM_NAME}
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
