import "server-only";

import {
  FOOTER_LINKS,
  HELP_LINKS,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export type LaunchPolishSnapshot = {
  legalPagesReady: boolean;
  supportEmailConfigured: boolean;
  documentationReady: boolean;
  statusPageReady: boolean;
  footerLinksReady: boolean;
  helpCenterReady: boolean;
  marketingSiteReady: boolean;
  score: number;
  complete: boolean;
  label: "Launch Polish Complete" | "Launch Polish Incomplete";
};

function isEmailConfigured(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Static launch polish checks — legal, help, marketing, and trust infrastructure. */
export function getLaunchPolishSnapshot(): LaunchPolishSnapshot {
  const legalPagesReady = Object.values(LEGAL_ROUTES).every((route) => route.startsWith("/"));
  const supportEmailConfigured = isEmailConfigured(SUPPORT_EMAIL);
  const documentationReady =
    HELP_LINKS.documentation === MARKETING_ROUTES.documentation ||
    HELP_LINKS.documentation === "/docs";
  const statusPageReady = HELP_LINKS.statusPage === MARKETING_ROUTES.status;
  const footerLinksReady = FOOTER_LINKS.length >= 7;
  const helpCenterReady =
    !HELP_LINKS.support.includes("coming soon") && HELP_LINKS.helpCenter === MARKETING_ROUTES.help;
  const marketingSiteReady =
    MARKETING_ROUTES.features.startsWith("/") && MARKETING_ROUTES.contact.startsWith("/");

  const checks = [
    legalPagesReady,
    supportEmailConfigured,
    documentationReady,
    statusPageReady,
    footerLinksReady,
    helpCenterReady,
    marketingSiteReady,
  ];

  const passed = checks.filter(Boolean).length;
  const score = Math.round((passed / checks.length) * 100);
  const complete = passed === checks.length;

  return {
    legalPagesReady,
    supportEmailConfigured,
    documentationReady,
    statusPageReady,
    footerLinksReady,
    helpCenterReady,
    marketingSiteReady,
    score,
    complete,
    label: complete ? "Launch Polish Complete" : "Launch Polish Incomplete",
  };
}
