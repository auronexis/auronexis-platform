export type IntegrationConnectionLabel = "Connected" | "Not Connected" | "Partially configured";

export type IntegrationCenterOpenAI = {
  connectionStatus: IntegrationConnectionLabel;
  provider: string;
  currentModel: string | null;
  lastSuccessfulRequest: string | null;
  usageSummary: string | null;
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
};
