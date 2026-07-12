export type OpenAIPlatformState =
  | "disabled"
  | "not_configured"
  | "configured"
  | "connected"
  | "degraded";

export type OpenAIErrorCode =
  | "disabled"
  | "not_configured"
  | "authentication"
  | "permission"
  | "invalid_request"
  | "rate_limited"
  | "quota_or_billing"
  | "timeout"
  | "provider_unavailable"
  | "unsafe_or_refused"
  | "malformed_output"
  | "unknown";

export type OpenAIPlatformConfig = {
  enabled: boolean;
  provider: string;
  apiKey: string | undefined;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  state: OpenAIPlatformState;
};

export type OpenAIConnectionTestResult = {
  ok: boolean;
  state: OpenAIPlatformState;
  message: string;
  model: string | null;
  latencyMs: number | null;
  providerRequestId: string | null;
  errorCode: OpenAIErrorCode | null;
  checkedAt: string;
};

export type OpenAIHealthRecord = {
  ok: boolean;
  model: string | null;
  latencyMs: number | null;
  providerRequestId: string | null;
  errorCode: string | null;
  sanitizedMessage: string | null;
  createdAt: string;
};

export type OpenAIRequestLogInput = {
  organizationId: string;
  userId: string;
  clientId?: string | null;
  reportId?: string | null;
  model: string;
  feature: string;
  status: "succeeded" | "failed";
  promptVersion?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  latencyMs?: number | null;
  providerRequestId?: string | null;
  errorCode?: string | null;
};
