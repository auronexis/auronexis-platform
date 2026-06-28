import { normalizeHexColor } from "@/lib/branding/defaults";
import type { WhiteLabelThemeTokens } from "@/lib/white-label/types";

const DEFAULTS = {
  surface: "#FFFFFF",
  background: "#F8FAFC",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
};

export function buildThemeTokens(input: {
  primary: string | null | undefined;
  secondary: string | null | undefined;
  accent?: string | null | undefined;
  success?: string | null | undefined;
  warning?: string | null | undefined;
  danger?: string | null | undefined;
}): WhiteLabelThemeTokens {
  return {
    primary: normalizeHexColor(input.primary, "#2563EB"),
    secondary: normalizeHexColor(input.secondary, "#071A3D"),
    accent: normalizeHexColor(input.accent ?? input.primary, "#2563EB"),
    surface: DEFAULTS.surface,
    background: DEFAULTS.background,
    border: DEFAULTS.border,
    text: DEFAULTS.text,
    muted: DEFAULTS.muted,
    success: normalizeHexColor(input.success, "#16A34A"),
    warning: normalizeHexColor(input.warning, "#D97706"),
    danger: normalizeHexColor(input.danger, "#DC2626"),
  };
}

export function buildThemeCssVariables(tokens: WhiteLabelThemeTokens): string {
  return [
    `--brand-primary:${tokens.primary}`,
    `--brand-secondary:${tokens.secondary}`,
    `--brand-accent:${tokens.accent}`,
    `--brand-surface:${tokens.surface}`,
    `--brand-background:${tokens.background}`,
    `--brand-border:${tokens.border}`,
    `--brand-text:${tokens.text}`,
    `--brand-muted:${tokens.muted}`,
    `--brand-success:${tokens.success}`,
    `--brand-warning:${tokens.warning}`,
    `--brand-danger:${tokens.danger}`,
    `--color-primary:${tokens.primary}`,
    `--color-secondary:${tokens.secondary}`,
  ].join(";");
}

export function themeTokensToStyleObject(tokens: WhiteLabelThemeTokens): Record<string, string> {
  return {
    "--brand-primary": tokens.primary,
    "--brand-secondary": tokens.secondary,
    "--brand-accent": tokens.accent,
    "--brand-surface": tokens.surface,
    "--brand-background": tokens.background,
    "--brand-border": tokens.border,
    "--brand-text": tokens.text,
    "--brand-muted": tokens.muted,
    "--brand-success": tokens.success,
    "--brand-warning": tokens.warning,
    "--brand-danger": tokens.danger,
  };
}
