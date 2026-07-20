import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { bootstrapConnectors } from "@/lib/connectors/bootstrap";
import { getConnectorConfig } from "@/lib/connectors/queries";
import {
  computeTokenExpiry,
  exchangeAuthorizationCode,
  isConnectorOAuthConfigured,
} from "@/lib/connectors/oauth/platform";
import { consumeOAuthState, validateOAuthState } from "@/lib/connectors/oauth/state";
import { storeOAuthTokens } from "@/lib/connectors/oauth/storage";
import { isConnectorId } from "@/lib/connectors/types";
import { getAppUrl } from "@/lib/env";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

type RouteContext = {
  params: Promise<{ connectorId: string }>;
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const session = await getSession();
  const appUrl = getAppUrl();
  const dashboardUrl = new URL("/automation/connectors", appUrl);

  if (!session) {
    dashboardUrl.searchParams.set("error", "session");
    return NextResponse.redirect(dashboardUrl);
  }

  const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
  if (!access.allowed || !canManageOrganizationSettings(session)) {
    dashboardUrl.searchParams.set("error", "access");
    return NextResponse.redirect(dashboardUrl);
  }

  const { connectorId: rawConnectorId } = await context.params;
  if (!isConnectorId(rawConnectorId)) {
    dashboardUrl.searchParams.set("error", "unknown");
    return NextResponse.redirect(dashboardUrl);
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    dashboardUrl.searchParams.set("error", error);
    return NextResponse.redirect(dashboardUrl);
  }

  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");
  if (!code || !stateToken) {
    dashboardUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(dashboardUrl);
  }

  const stateRecord = await consumeOAuthState(stateToken);
  if (!stateRecord || !validateOAuthState(stateRecord, rawConnectorId)) {
    dashboardUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(dashboardUrl);
  }

  if (stateRecord.organizationId !== session.organization.id) {
    dashboardUrl.searchParams.set("error", "organization");
    return NextResponse.redirect(dashboardUrl);
  }

  bootstrapConnectors();
  const config = getConnectorConfig(rawConnectorId);
  if (!config || !isConnectorOAuthConfigured(config)) {
    dashboardUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      config,
      code,
      redirectUri: stateRecord.redirectUri,
      codeVerifier: stateRecord.codeVerifier,
    });

    await storeOAuthTokens({
      organizationId: session.organization.id,
      connectorId: rawConnectorId,
      displayName: config.name,
      createdBy: session.user.id,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: computeTokenExpiry(tokens.expiresIn),
        scopes: tokens.scope.length > 0 ? tokens.scope : stateRecord.scopes,
      },
    });

    dashboardUrl.searchParams.set("connected", rawConnectorId);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("[connectors/oauth] token exchange failed:", {
      connectorId: rawConnectorId,
      organizationId: session.organization.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    dashboardUrl.searchParams.set("error", "exchange");
    return NextResponse.redirect(dashboardUrl);
  }
}
