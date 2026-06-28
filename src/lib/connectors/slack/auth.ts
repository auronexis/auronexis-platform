import { SLACK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { buildOAuthEnvKeys, isOAuthConfigured } from "@/lib/connectors/shared/module-config";
import { buildAuthorizeUrl, isConnectorOAuthConfigured } from "@/lib/connectors/oauth";

export const AUTH_CONFIG = SLACK_CONNECTOR_CONFIG;

export function getOAuthEnvKeys() {
  return buildOAuthEnvKeys(AUTH_CONFIG.authEnvPrefix);
}

export function isAuthConfigured(): boolean {
  return isConnectorOAuthConfigured(AUTH_CONFIG);
}

export function buildAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
  scopes?: string[];
  codeVerifier?: string | null;
}) {
  return buildAuthorizeUrl(AUTH_CONFIG, {
    connectorId: AUTH_CONFIG.id,
    redirectUri: input.redirectUri,
    state: input.state,
    scopes: input.scopes ?? [...AUTH_CONFIG.defaultScopes],
    codeVerifier: input.codeVerifier,
  });
}
