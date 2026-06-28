import "server-only";

import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { buildOAuthEnvKeys, isOAuthConfigured } from "@/lib/connectors/shared/module-config";
import { generatePkceChallenge } from "@/lib/connectors/oauth/state";
import type { ConnectorId } from "@/lib/connectors/types";

export type OAuthAuthorizeRequest = {
  connectorId: ConnectorId;
  redirectUri: string;
  state: string;
  scopes: string[];
  codeVerifier?: string | null;
};

export function buildAuthorizeUrl(
  config: ConnectorModuleConfig,
  request: OAuthAuthorizeRequest,
): string {
  if (!config.authorizeUrl) {
    throw new Error(`Connector ${config.id} does not support OAuth authorize URL.`);
  }

  const envKeys = buildOAuthEnvKeys(config.authEnvPrefix);
  const clientId = process.env[envKeys.clientId];
  if (!clientId) {
    throw new Error(`OAuth client ID not configured for ${config.id}.`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: request.redirectUri,
    response_type: "code",
    state: request.state,
    scope: request.scopes.join(" "),
  });

  if (request.codeVerifier) {
    params.set("code_challenge", generatePkceChallenge(request.codeVerifier));
    params.set("code_challenge_method", "S256");
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

export type OAuthTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string[];
};

export async function exchangeAuthorizationCode(input: {
  config: ConnectorModuleConfig;
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<OAuthTokenResponse> {
  if (!input.config.tokenUrl) {
    throw new Error(`Connector ${input.config.id} does not support token exchange.`);
  }

  const envKeys = buildOAuthEnvKeys(input.config.authEnvPrefix);
  const clientId = process.env[envKeys.clientId];
  const clientSecret = process.env[envKeys.clientSecret];

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${input.config.id}.`);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (input.codeVerifier) {
    body.set("code_verifier", input.codeVerifier);
  }

  const response = await fetch(input.config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: HTTP ${response.status}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return {
    accessToken: String(json.access_token ?? ""),
    refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : null,
    expiresIn: typeof json.expires_in === "number" ? json.expires_in : null,
    scope: typeof json.scope === "string" ? json.scope.split(" ") : [],
  };
}

export async function refreshAccessToken(input: {
  config: ConnectorModuleConfig;
  refreshToken: string;
}): Promise<OAuthTokenResponse> {
  if (!input.config.tokenUrl) {
    throw new Error(`Connector ${input.config.id} does not support token refresh.`);
  }

  const envKeys = buildOAuthEnvKeys(input.config.authEnvPrefix);
  const clientId = process.env[envKeys.clientId];
  const clientSecret = process.env[envKeys.clientSecret];

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${input.config.id}.`);
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: input.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(input.config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth refresh failed: HTTP ${response.status}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return {
    accessToken: String(json.access_token ?? ""),
    refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : input.refreshToken,
    expiresIn: typeof json.expires_in === "number" ? json.expires_in : null,
    scope: typeof json.scope === "string" ? json.scope.split(" ") : [],
  };
}

export function isConnectorOAuthConfigured(config: ConnectorModuleConfig): boolean {
  if (config.oauth === "none") {
    return false;
  }
  return isOAuthConfigured(config.authEnvPrefix);
}

export function computeTokenExpiry(expiresIn: number | null): string | null {
  if (expiresIn == null) {
    return null;
  }
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
