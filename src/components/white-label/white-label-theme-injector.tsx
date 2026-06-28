"use client";

import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";

type WhiteLabelThemeInjectorProps = {
  branding: ResolvedOrganizationBranding;
  scopeId?: string;
};

export function WhiteLabelThemeInjector({
  branding,
  scopeId = "white-label-root",
}: WhiteLabelThemeInjectorProps) {
  const cssVariables = branding.cssVariables;
  const customCss = branding.customCss;

  if (!cssVariables && !customCss) {
    return null;
  }

  const css = [
    cssVariables ? `#${scopeId}{${cssVariables}}` : "",
    customCss ? `#${scopeId} .white-label-scope{${customCss}}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
