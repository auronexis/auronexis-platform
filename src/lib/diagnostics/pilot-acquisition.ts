import "server-only";

import {
  FOOTER_SECTIONS,
  HELP_LINKS,
  INFO_EMAIL,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  PUBLIC_SITEMAP_ROUTES,
  SALES_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export type PilotAcquisitionSnapshot = {
  websiteReadiness: number;
  legalReadiness: number;
  supportReadiness: number;
  pilotReadiness: number;
  score: number;
  complete: boolean;
  label: "Pilot Acquisition Ready" | "Pilot Acquisition Incomplete";
};

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function isEmailConfigured(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Sprint 3 pilot acquisition readiness — website, legal, support, and pilot surfaces. */
export function getPilotAcquisitionSnapshot(): PilotAcquisitionSnapshot {
  const websiteChecks = [
    MARKETING_ROUTES.home === "/",
    MARKETING_ROUTES.features.startsWith("/"),
    MARKETING_ROUTES.pricing === "/pricing",
    MARKETING_ROUTES.pilotProgram === "/pilot-program",
    MARKETING_ROUTES.contact === "/contact",
    MARKETING_ROUTES.status === "/status",
    FOOTER_SECTIONS.product.length >= 8,
  ];

  const legalChecks = [
    LEGAL_ROUTES.imprint === "/imprint",
    LEGAL_ROUTES.privacy === "/privacy",
    LEGAL_ROUTES.terms === "/terms",
    LEGAL_ROUTES.cookies === "/cookies",
    LEGAL_ROUTES.securityPolicy === "/security-policy",
    LEGAL_ROUTES.subprocessors === "/subprocessors",
    LEGAL_ROUTES.dataProcessingAgreement === "/data-processing-agreement",
    LEGAL_ROUTES.acceptableUse === "/acceptable-use",
  ];

  const supportChecks = [
    HELP_LINKS.documentation === "/documentation",
    HELP_LINKS.support === "/support",
    HELP_LINKS.statusPage === "/status",
    HELP_LINKS.pilotProgram === "/pilot-program",
    HELP_LINKS.contact === "/contact",
    HELP_LINKS.helpCenter === "/help",
    isEmailConfigured(SUPPORT_EMAIL),
    isEmailConfigured(INFO_EMAIL),
  ];

  const pilotChecks = [
    MARKETING_ROUTES.pilotProgram === "/pilot-program",
    isEmailConfigured(SALES_EMAIL),
    PUBLIC_SITEMAP_ROUTES.includes("/pilot-program"),
    !HELP_LINKS.support.includes("coming soon"),
  ];

  const websiteReadiness = scoreChecks(websiteChecks);
  const legalReadiness = scoreChecks(legalChecks);
  const supportReadiness = scoreChecks(supportChecks);
  const pilotReadiness = scoreChecks(pilotChecks);

  const score = Math.round(
    (websiteReadiness + legalReadiness + supportReadiness + pilotReadiness) / 4,
  );

  const complete = score >= 95;

  return {
    websiteReadiness,
    legalReadiness,
    supportReadiness,
    pilotReadiness,
    score,
    complete,
    label: complete ? "Pilot Acquisition Ready" : "Pilot Acquisition Incomplete",
  };
}
