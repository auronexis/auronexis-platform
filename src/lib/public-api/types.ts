export type {
  ApiScope,
  ApiKeyType,
  ApiKeyStatus,
  ApiKeyView,
  ApiKeyCreateResult,
  ApiDashboardSnapshot,
  ApiWebhookEndpointView,
  ApiWebhookDeliveryView,
} from "@/lib/api/types";

export type PublicApiContext = import("@/lib/api/auth/context").ApiContext;

export type PublicApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "validation_error"
  | "not_found"
  | "rate_limit_exceeded"
  | "internal_error";

export type PublicApiErrorBody = {
  error: {
    code: PublicApiErrorCode;
    message: string;
  };
};
