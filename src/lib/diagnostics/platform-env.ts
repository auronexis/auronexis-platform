import "server-only";

import type { EnvVarStatus } from "@/lib/diagnostics/types";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function maskPublicValue(value: string): string {
  if (value.length <= 6) {
    return value;
  }

  return `…${value.slice(-6)}`;
}

function envStatus(name: string, showPreview = false): EnvVarStatus {
  const value = readEnv(name);

  return {
    name,
    present: Boolean(value),
    preview: showPreview && value ? maskPublicValue(value) : undefined,
  };
}

export type PlatformEnvDiagnostics = {
  supabaseUrl: EnvVarStatus;
  supabaseAnonKey: EnvVarStatus;
  supabaseServiceRoleKey: EnvVarStatus;
  openaiApiKey: EnvVarStatus;
  openaiModel: EnvVarStatus;
  anthropicApiKey: EnvVarStatus;
  aiProvider: EnvVarStatus;
  platformAdminUserIds: EnvVarStatus;
};

export function getPlatformEnvDiagnostics(): PlatformEnvDiagnostics {
  return {
    supabaseUrl: envStatus("NEXT_PUBLIC_SUPABASE_URL", true),
    supabaseAnonKey: envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: envStatus("SUPABASE_SERVICE_ROLE_KEY"),
    openaiApiKey: envStatus("OPENAI_API_KEY"),
    openaiModel: envStatus("OPENAI_MODEL", true),
    anthropicApiKey: envStatus("ANTHROPIC_API_KEY"),
    aiProvider: envStatus("AI_PROVIDER", true),
    platformAdminUserIds: envStatus("PLATFORM_ADMIN_USER_IDS"),
  };
}
