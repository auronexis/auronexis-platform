"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandLogo } from "@/components/branding/brand-logo";
import {
  publishWhiteLabelSettingsAction,
  resetWhiteLabelSettingsAction,
  saveWhiteLabelSettingsAction,
  uploadWhiteLabelAssetAction,
} from "@/lib/white-label/actions";
import type { ResolvedWhiteLabelBranding, WhiteLabelSettingsView } from "@/lib/white-label/types";
import { getPreviewViewportClass } from "@/lib/white-label/preview";
import { buildCustomDomainStatus } from "@/lib/white-label/domains";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { formGrid } from "@/lib/ui/form-tokens";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";

type WhiteLabelWorkspaceProps = {
  settings: WhiteLabelSettingsView | null;
  previewBranding: ResolvedWhiteLabelBranding;
  canManage: boolean;
  organizationName: string;
};

type SectionKey = "general" | "brand" | "theme" | "portal" | "emails" | "pdf" | "domain";

const SECTIONS: Array<{ id: SectionKey; label: string }> = [
  { id: "general", label: "General" },
  { id: "brand", label: "Brand" },
  { id: "theme", label: "Theme" },
  { id: "portal", label: "Portal" },
  { id: "emails", label: "Emails" },
  { id: "pdf", label: "PDF" },
  { id: "domain", label: "Domain" },
];

export function WhiteLabelWorkspace({
  settings,
  previewBranding,
  canManage,
  organizationName,
}: WhiteLabelWorkspaceProps) {
  const [section, setSection] = useState<SectionKey>("general");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewSurface, setPreviewSurface] = useState<"dashboard" | "login" | "portal" | "pdf" | "email">("dashboard");
  const [draft, setDraft] = useState(previewBranding);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const legacyPreview: ResolvedOrganizationBranding = useMemo(
    () => ({
      companyName: draft.companyName,
      platformName: draft.platformName,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
      accentColor: draft.accentColor,
      logoUrl: draft.logoUrl,
      logoLightUrl: draft.logoLightUrl,
      faviconUrl: draft.faviconUrl,
      portalWelcomeMessage: draft.portalWelcomeMessage,
      cssVariables: draft.cssVariables,
      hidePlatformBranding: draft.hidePlatformBranding,
    }),
    [draft],
  );

  const domainStatus = buildCustomDomainStatus(settings?.customDomain ?? draft.customDomain);

  const handleSave = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveWhiteLabelSettingsAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success ?? "Settings saved.");
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishWhiteLabelSettingsAction();
      setSuccess(result.success ?? null);
      setError(result.error ?? null);
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetWhiteLabelSettingsAction();
      setSuccess(result.success ?? null);
      setError(result.error ?? null);
    });
  };

  const handleAssetUpload = (kind: "logo_light" | "logo_dark" | "favicon", file: File) => {
    setError(null);
    startTransition(async () => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const base64Data = btoa(binary);
      const result = await uploadWhiteLabelAssetAction({
        kind,
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.plaintextAssetUrl) {
        setDraft((current) => ({
          ...current,
          logoUrl: kind === "logo_light" ? result.plaintextAssetUrl! : current.logoUrl,
          logoLightUrl: kind === "logo_light" ? result.plaintextAssetUrl! : current.logoLightUrl,
          logoDarkUrl: kind === "logo_dark" ? result.plaintextAssetUrl! : current.logoDarkUrl,
          faviconUrl: kind === "favicon" ? result.plaintextAssetUrl! : current.faviconUrl,
        }));
      }
      setSuccess(result.success ?? "Asset uploaded.");
    });
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
      <nav className="space-y-1">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              section === item.id ? "bg-primary/10 font-medium text-primary" : "text-muted hover:bg-muted/10"
            }`}
          >
            {item.label}
          </button>
        ))}
        <div className="pt-4">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
          <div className="mt-2 flex flex-wrap gap-2 px-3">
            {(["dashboard", "login", "portal", "pdf", "email"] as const).map((surface) => (
              <button
                key={surface}
                type="button"
                onClick={() => setPreviewSurface(surface)}
                className={`rounded-md px-2 py-1 text-xs capitalize ${
                  previewSurface === surface ? "bg-secondary text-secondary-foreground" : "bg-muted/10 text-muted"
                }`}
              >
                {surface}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div>
        {!canManage ? (
          <p className="text-sm text-muted">Only owners and admins can manage white label settings.</p>
        ) : (
          <form action={handleSave}>
            <FormRoot>
              <HiddenSettingsFields settings={settings} draft={draft} section={section} organizationName={organizationName} />
              {section === "general" ? (
                <FormSection title="General" description="Company and platform identity.">
                  <Input name="companyName" label="Company name" defaultValue={settings?.companyName ?? organizationName} required />
                  <Input name="platformName" label="Platform name" defaultValue={settings?.platformName ?? ""} placeholder={organizationName} />
                  <Input name="website" label="Website" defaultValue={settings?.website ?? ""} placeholder="https://example.com" />
                </FormSection>
              ) : null}

              {section === "brand" ? (
                <FormSection title="Brand assets" description="Upload logos and favicon. PNG, SVG, ICO, WEBP up to 2 MB.">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(["logo_light", "logo_dark", "favicon"] as const).map((kind) => (
                      <label key={kind} className="rounded-xl border border-border p-4">
                        <span className="text-sm font-medium capitalize">{kind.replace(/_/g, " ")}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                          className="mt-2 block w-full text-xs"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleAssetUpload(kind, file);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </FormSection>
              ) : null}

              {section === "theme" ? (
                <FormSection title="Theme colors" description="Dynamic Aurora tokens applied at runtime.">
                  <div className={formGrid}>
                    <Input name="primaryColor" label="Primary" defaultValue={settings?.primaryColor ?? draft.primaryColor} required />
                    <Input name="secondaryColor" label="Secondary" defaultValue={settings?.secondaryColor ?? draft.secondaryColor} required />
                    <Input name="accentColor" label="Accent" defaultValue={settings?.accentColor ?? draft.accentColor} required />
                    <Input name="successColor" label="Success" defaultValue={settings?.successColor ?? draft.successColor} required />
                    <Input name="warningColor" label="Warning" defaultValue={settings?.warningColor ?? draft.warningColor} required />
                    <Input name="dangerColor" label="Danger" defaultValue={settings?.dangerColor ?? draft.dangerColor} required />
                  </div>
                  <Textarea name="customCss" label="Custom CSS" rows={4} defaultValue={settings?.customCss ?? ""} placeholder=".sidebar { border-radius: 12px; }" />
                </FormSection>
              ) : null}

              {section === "portal" ? (
                <FormSection title="Client portal" description="Portal title, messaging, and support links.">
                  <Input name="portalTitle" label="Portal title" defaultValue={settings?.portalTitle ?? ""} />
                  <Textarea name="portalDescription" label="Portal description" rows={2} defaultValue={settings?.portalDescription ?? ""} />
                  <Textarea name="portalWelcomeMessage" label="Welcome message" rows={3} defaultValue={settings?.portalWelcomeMessage ?? draft.portalWelcomeMessage} />
                  <div className={formGrid}>
                    <Input name="supportEmail" label="Support email" defaultValue={settings?.supportEmail ?? ""} />
                    <Input name="supportUrl" label="Support URL" defaultValue={settings?.supportUrl ?? ""} />
                    <Input name="privacyUrl" label="Privacy URL" defaultValue={settings?.privacyUrl ?? ""} />
                    <Input name="termsUrl" label="Terms URL" defaultValue={settings?.termsUrl ?? ""} />
                  </div>
                </FormSection>
              ) : null}

              {section === "emails" ? (
                <FormSection title="Email branding" description="Sender identity and support details for transactional email.">
                  <Input name="emailSenderName" label="Sender name" defaultValue={settings?.emailSenderName ?? ""} />
                  <Input name="emailSenderAddress" label="Sender address" defaultValue={settings?.emailSenderAddress ?? ""} placeholder="reports@yourcompany.com" />
                  <Input name="loginTitle" label="Login title" defaultValue={settings?.loginTitle ?? ""} />
                  <Input name="loginSubtitle" label="Login subtitle" defaultValue={settings?.loginSubtitle ?? ""} />
                  <Textarea name="loginWelcomeMessage" label="Login welcome message" rows={2} defaultValue={settings?.loginWelcomeMessage ?? ""} />
                </FormSection>
              ) : null}

              {section === "pdf" ? (
                <FormSection title="PDF branding" description="Footer and support details on exported reports.">
                  <Textarea name="pdfFooter" label="PDF footer" rows={3} defaultValue={settings?.pdfFooter ?? ""} placeholder="© Your Company. All rights reserved." />
                </FormSection>
              ) : null}

              {section === "domain" ? (
                <FormSection title="Custom domain" description="Architecture-only in v1. DNS and SSL remain pending until provisioning ships.">
                  <Input name="customDomain" label="Custom domain" defaultValue={settings?.customDomain ?? ""} placeholder="portal.customer.com" />
                  {domainStatus ? (
                    <div className="rounded-lg border border-border/70 bg-muted/5 p-4 text-sm text-muted">
                      <p>Verification: {domainStatus.verificationStatus}</p>
                      <p>SSL: {domainStatus.sslStatus}</p>
                      <ul className="mt-2 list-disc pl-5">
                        {domainStatus.instructions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </FormSection>
              ) : null}

              {error ? <FormAlert variant="error">{error}</FormAlert> : null}
              {success ? <FormAlert variant="success">{success}</FormAlert> : null}

              <FormFooter>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" loading={isPending}>Save</Button>
                  <Button type="button" variant="secondary" disabled={isPending} onClick={handlePublish}>Publish</Button>
                  <Button type="button" variant="ghost" disabled={isPending} onClick={handleReset}>Reset</Button>
                </div>
              </FormFooter>
            </FormRoot>
          </form>
        )}
      </div>

      <aside className="space-y-4">
        <div className="flex gap-2">
          {(["desktop", "tablet", "mobile"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setViewport(item)}
              className={`rounded-md px-2 py-1 text-xs capitalize ${
                viewport === item ? "bg-primary text-primary-foreground" : "bg-muted/10 text-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={`mx-auto w-full ${getPreviewViewportClass(viewport)}`}>
          <PreviewSurface surface={previewSurface} branding={legacyPreview} draft={draft} />
        </div>
        <p className="text-xs text-muted">
          {settings?.publishedAt
            ? `Published ${new Date(settings.publishedAt).toLocaleString()}`
            : "Draft — publish to apply across dashboard, portal, email, and PDF."}
        </p>
      </aside>
    </div>
  );
}

function HiddenSettingsFields({
  settings,
  draft,
  section,
  organizationName,
}: {
  settings: WhiteLabelSettingsView | null;
  draft: ResolvedWhiteLabelBranding;
  section: SectionKey;
  organizationName: string;
}) {
  const values: Record<string, string> = {
    companyName: settings?.companyName ?? organizationName,
    platformName: settings?.platformName ?? draft.platformName,
    website: settings?.website ?? "",
    primaryColor: settings?.primaryColor ?? draft.primaryColor,
    secondaryColor: settings?.secondaryColor ?? draft.secondaryColor,
    accentColor: settings?.accentColor ?? draft.accentColor,
    successColor: settings?.successColor ?? draft.successColor,
    warningColor: settings?.warningColor ?? draft.warningColor,
    dangerColor: settings?.dangerColor ?? draft.dangerColor,
    customCss: settings?.customCss ?? "",
    portalTitle: settings?.portalTitle ?? "",
    portalDescription: settings?.portalDescription ?? "",
    portalWelcomeMessage: settings?.portalWelcomeMessage ?? draft.portalWelcomeMessage,
    supportEmail: settings?.supportEmail ?? "",
    supportUrl: settings?.supportUrl ?? "",
    privacyUrl: settings?.privacyUrl ?? "",
    termsUrl: settings?.termsUrl ?? "",
    emailSenderName: settings?.emailSenderName ?? "",
    emailSenderAddress: settings?.emailSenderAddress ?? "",
    loginTitle: settings?.loginTitle ?? "",
    loginSubtitle: settings?.loginSubtitle ?? "",
    loginWelcomeMessage: settings?.loginWelcomeMessage ?? "",
    pdfFooter: settings?.pdfFooter ?? "",
    customDomain: settings?.customDomain ?? "",
  };

  const visibleFields: Record<SectionKey, string[]> = {
    general: ["companyName", "platformName", "website"],
    brand: [],
    theme: [
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "successColor",
      "warningColor",
      "dangerColor",
      "customCss",
    ],
    portal: [
      "portalTitle",
      "portalDescription",
      "portalWelcomeMessage",
      "supportEmail",
      "supportUrl",
      "privacyUrl",
      "termsUrl",
    ],
    emails: [
      "emailSenderName",
      "emailSenderAddress",
      "loginTitle",
      "loginSubtitle",
      "loginWelcomeMessage",
    ],
    pdf: ["pdfFooter"],
    domain: ["customDomain"],
  };

  const hiddenNames = Object.keys(values).filter(
    (name) => !visibleFields[section].includes(name),
  );

  return (
    <>
      {hiddenNames.map((name) => (
        <input key={name} type="hidden" name={name} value={values[name] ?? ""} />
      ))}
    </>
  );
}

function PreviewSurface({
  surface,
  branding,
  draft,
}: {
  surface: "dashboard" | "login" | "portal" | "pdf" | "email";
  branding: ResolvedOrganizationBranding;
  draft: ResolvedWhiteLabelBranding;
}) {
  if (surface === "login") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="px-4 py-8 text-center text-white" style={{ backgroundColor: draft.secondaryColor }}>
          <BrandLogo branding={branding} size="md" variant="light" />
          <p className="mt-3 text-lg font-semibold">{draft.loginTitle}</p>
          <p className="text-sm opacity-80">{draft.loginSubtitle ?? "Welcome back"}</p>
        </div>
        <div className="p-4 text-sm text-muted">Secure sign in preview</div>
      </div>
    );
  }

  if (surface === "portal") {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="px-4 py-3 text-white" style={{ backgroundColor: draft.secondaryColor }}>
          <BrandLogo branding={branding} size="sm" variant="light" />
          <p className="mt-2 text-sm font-semibold">{draft.portalTitle}</p>
        </div>
        <div className="bg-[var(--brand-background,var(--color-surface-2))] p-4 text-sm text-muted">{draft.portalWelcomeMessage}</div>
      </div>
    );
  }

  if (surface === "pdf" || surface === "email") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        <div className="px-4 py-3 text-white" style={{ backgroundColor: draft.secondaryColor }}>
          <BrandLogo branding={branding} size="sm" variant="light" />
          <p className="text-xs font-bold">{draft.companyName}</p>
        </div>
        <div className="p-4 text-sm text-muted">
          {surface === "pdf" ? draft.pdfFooter ?? draft.companyName : `From: ${draft.emailSenderName ?? draft.companyName}`}
        </div>
        <div className="border-t px-4 py-2 text-[10px] text-muted">
          {draft.hidePlatformBranding ? draft.companyName : `Powered by ${PLATFORM_NAME}`}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="px-4 py-4 text-white" style={{ backgroundColor: draft.secondaryColor }}>
        <BrandLogo branding={branding} size="sm" variant="light" />
        <p className="mt-2 text-sm font-semibold">{draft.companyName}</p>
        <p className="text-xs opacity-70">Operations Command Center</p>
      </div>
      <div className="h-24 bg-[var(--brand-background,var(--color-surface-2))]" />
    </div>
  );
}
