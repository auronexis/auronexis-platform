export type IntegrationConnectionLabel =
  | "Connected"
  | "Not Connected"
  | "Partially configured"
  | "Configured"
  | "Degraded"
  | "Disabled"
  | "Not configured";

export type IntegrationCenterOpenAI = {
  connectionStatus: IntegrationConnectionLabel;
  state: string;
  provider: string;
  currentModel: string | null;
  lastSuccessfulCheck: string | null;
  lastFailedCheck: string | null;
  lastLatencyMs: number | null;
  sanitizedError: string | null;
  usageSummary: string | null;
  canTestConnection: boolean;
};

export type IntegrationCenterAnthropic = {
  connectionStatus: IntegrationConnectionLabel;
};

export type IntegrationCenterSlack = {
  workspace: string | null;
  connectedChannels: string | null;
  status: string;
};

export type IntegrationCenterStripe = {
  connectionStatus: IntegrationConnectionLabel;
  mode: string | null;
  customerPortal: string;
  invoices: string;
};

export type IntegrationCenterWebhooks = {
  activeWebhooks: number | null;
  lastDelivery: string | null;
  failures: number | null;
};

export type IntegrationCenterResend = {
  domainStatus: string;
  verified: string;
  lastEmail: string | null;
};

export type IntegrationCenterRestApi = {
  activeKeyCount: number;
  requestsToday: number;
  lastUsage: string | null;
  documentationUrl: string;
};

export type IntegrationCenterSnapshot = {
  openai: IntegrationCenterOpenAI;
  anthropic: IntegrationCenterAnthropic;
  slack: IntegrationCenterSlack;
  stripe: IntegrationCenterStripe;
  webhooks: IntegrationCenterWebhooks;
  resend: IntegrationCenterResend;
  restApi: IntegrationCenterRestApi;
};

export type OpenAIConnectionTestResult = {
  ok: boolean;
  message: string;
  latencyMs: number | null;
  state?: string;
  model?: string | null;
  errorCode?: string | null;
};
