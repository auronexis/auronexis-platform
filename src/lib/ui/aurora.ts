/**
 * Aurora Design Language — module accents and premium surface tokens.
 * UI-only; no business logic.
 */

export type AuroraModule =
  | "dashboard"
  | "clients"
  | "reports"
  | "activity"
  | "risks"
  | "incidents"
  | "profitability"
  | "workflows"
  | "knowledge"
  | "settings"
  | "pricing"
  | "sales"
  | "notifications";

export type AuroraModuleIdentity = {
  eyebrow: string;
  defaultTitle?: string;
  accentEyebrow: string;
  accentBorder: string;
  accentGlow: string;
  iconContainer: string;
  statusBar: string;
};

export const AURORA_MODULES: Record<AuroraModule, AuroraModuleIdentity> = {
  dashboard: {
    eyebrow: "Command Center",
    defaultTitle: "Operations Command Center",
    accentEyebrow: "text-primary",
    accentBorder: "border-primary/25",
    accentGlow: "from-primary/12 via-primary/5 to-transparent",
    iconContainer: "border-primary/20 bg-primary/10 text-primary",
    statusBar: "bg-primary",
  },
  clients: {
    eyebrow: "Client Portfolio",
    accentEyebrow: "text-emerald-600",
    accentBorder: "border-emerald-500/25",
    accentGlow: "from-emerald-500/12 via-emerald-500/5 to-transparent",
    iconContainer: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    statusBar: "bg-emerald-500",
  },
  reports: {
    eyebrow: "Report Operations",
    accentEyebrow: "text-violet-600",
    accentBorder: "border-violet-500/25",
    accentGlow: "from-violet-500/12 via-violet-500/5 to-transparent",
    iconContainer: "border-violet-500/20 bg-violet-500/10 text-violet-600",
    statusBar: "bg-violet-500",
  },
  activity: {
    eyebrow: "Workspace Activity",
    accentEyebrow: "text-amber-600",
    accentBorder: "border-amber-500/25",
    accentGlow: "from-amber-500/12 via-amber-500/5 to-transparent",
    iconContainer: "border-amber-500/20 bg-amber-500/10 text-amber-600",
    statusBar: "bg-amber-500",
  },
  risks: {
    eyebrow: "Threat Monitoring",
    accentEyebrow: "text-orange-600",
    accentBorder: "border-orange-500/25",
    accentGlow: "from-orange-500/12 via-orange-500/5 to-transparent",
    iconContainer: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    statusBar: "bg-orange-500",
  },
  incidents: {
    eyebrow: "Incident Response",
    accentEyebrow: "text-red-600",
    accentBorder: "border-red-500/25",
    accentGlow: "from-red-500/12 via-red-500/5 to-transparent",
    iconContainer: "border-red-500/20 bg-red-500/10 text-red-600",
    statusBar: "bg-red-500",
  },
  profitability: {
    eyebrow: "Financial Intelligence",
    accentEyebrow: "text-green-600",
    accentBorder: "border-green-500/25",
    accentGlow: "from-green-500/12 via-green-500/5 to-transparent",
    iconContainer: "border-green-500/20 bg-green-500/10 text-green-600",
    statusBar: "bg-green-500",
  },
  workflows: {
    eyebrow: "Automation Builder",
    accentEyebrow: "text-cyan-600",
    accentBorder: "border-cyan-500/25",
    accentGlow: "from-cyan-500/12 via-cyan-500/5 to-transparent",
    iconContainer: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600",
    statusBar: "bg-cyan-500",
  },
  knowledge: {
    eyebrow: "Organizational Memory",
    accentEyebrow: "text-sky-600",
    accentBorder: "border-sky-500/25",
    accentGlow: "from-sky-500/12 via-sky-500/5 to-transparent",
    iconContainer: "border-sky-500/20 bg-sky-500/10 text-sky-600",
    statusBar: "bg-sky-500",
  },
  settings: {
    eyebrow: "Workspace Settings",
    accentEyebrow: "text-muted",
    accentBorder: "border-border-subtle",
    accentGlow: "from-muted/10 via-muted/5 to-transparent",
    iconContainer: "border-border-subtle bg-surface-2 text-secondary",
    statusBar: "bg-muted",
  },
  pricing: {
    eyebrow: "Plans & Pricing",
    accentEyebrow: "text-indigo-600",
    accentBorder: "border-indigo-500/25",
    accentGlow: "from-indigo-500/12 via-indigo-500/5 to-transparent",
    iconContainer: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600",
    statusBar: "bg-indigo-500",
  },
  sales: {
    eyebrow: "Revenue Generation",
    accentEyebrow: "text-teal-600",
    accentBorder: "border-teal-500/25",
    accentGlow: "from-teal-500/12 via-teal-500/5 to-transparent",
    iconContainer: "border-teal-500/20 bg-teal-500/10 text-teal-600",
    statusBar: "bg-teal-500",
  },
  notifications: {
    eyebrow: "Alert Center",
    accentEyebrow: "text-primary",
    accentBorder: "border-primary/25",
    accentGlow: "from-primary/12 via-primary/5 to-transparent",
    iconContainer: "border-primary/20 bg-primary/10 text-primary",
    statusBar: "bg-primary",
  },
};

export function getAuroraModule(module: AuroraModule): AuroraModuleIdentity {
  return AURORA_MODULES[module];
}

export function getAuroraModuleFromPath(pathname: string): AuroraModule | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/activity")) return "activity";
  if (pathname.startsWith("/risks")) return "risks";
  if (pathname.startsWith("/incidents")) return "incidents";
  if (pathname.startsWith("/profitability")) return "profitability";
  if (pathname.startsWith("/automation")) return "workflows";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/settings/plans")) return "pricing";
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/notifications")) return "notifications";
  return null;
}

export const auroraSurface =
  "rounded-2xl border border-border-subtle bg-surface-1 shadow-sm";

export const auroraSurfaceElevated =
  "rounded-2xl border border-border-subtle bg-gradient-to-b from-surface-1 via-surface-1 to-surface-2 shadow-md";

export const auroraSurfaceInteractive = [
  auroraSurface,
  "cursor-pointer shadow-sm",
  "transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
  "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg",
  "active:scale-[0.995]",
].join(" ");

export const auroraTableShell =
  "overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-sm";

export const auroraTableHead = "sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm";

export const auroraTableHeaderCell =
  "px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

export const auroraTableRow =
  "cursor-pointer transition-colors duration-150 hover:bg-primary/[0.04] data-[selected=true]:bg-primary/[0.08] data-[selected=true]:ring-1 data-[selected=true]:ring-inset data-[selected=true]:ring-primary/15";

export const auroraTableCell = "px-5 py-4 text-sm text-foreground/90";

export const auroraIconContainer =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border";
