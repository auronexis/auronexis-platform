/** Pilot simulation personas and accounts — single source for seeds, docs, and diagnostics. */

export const DEMO_WORKSPACE_SLUG = "aurora-demo";

export const PILOT_PERSONA_ORGS = [
  { name: "Acme Automation", slug: "acme-automation", segment: "Automation firm" },
  { name: "Vertex MSP", slug: "vertex-msp", segment: "Managed service provider" },
  { name: "Bluewave Consulting", slug: "bluewave-consulting", segment: "IT consultancy" },
  { name: "NovaOps", slug: "novaops", segment: "Operations agency" },
  { name: "CyberFlow", slug: "cyberflow", segment: "Security-focused MSP" },
] as const;

export type PilotAccountRole = "owner" | "admin" | "staff" | "viewer";

export const PILOT_DEMO_ACCOUNTS = [
  { email: "demo@auroranexis.com", role: "owner" as const, label: "Demo workspace owner" },
  { email: "pilot-owner@auroranexis.com", role: "admin" as const, label: "Pilot program admin" },
  { email: "pilot-operator@auroranexis.com", role: "staff" as const, label: "Pilot operator" },
  { email: "pilot-viewer@auroranexis.com", role: "viewer" as const, label: "Pilot read-only" },
] as const;

export const E2E_DEFAULT_EMAIL = "demo@auroranexis.com";
