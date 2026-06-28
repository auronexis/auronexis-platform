/** Auroranexis Client Portal design tokens — enterprise customer experience standard. */
export const portalTheme = {
  navy: "#071A3D",
  navyLight: "#0A234F",
  primary: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F8FAFC",
  card: "#FFFFFF",
  radius: "12px",
} as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CU";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function getHealthDisplay(status: string): {
  label: string;
  subtext: string;
  tone: "success" | "warning" | "danger" | "neutral";
} {
  switch (status) {
    case "active":
      return { label: "Active", subtext: "All systems operational", tone: "success" };
    case "watch":
      return { label: "Watch", subtext: "Monitoring recommended", tone: "warning" };
    case "critical":
      return { label: "Critical", subtext: "Attention required", tone: "danger" };
    default:
      return { label: "Archived", subtext: "No longer active", tone: "neutral" };
  }
}
