import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { bootstrapConnectors } from "@/lib/connectors/bootstrap";
import { getConnectorConfig } from "@/lib/connectors/queries";
import { buildAuthorizeUrl, isConnectorOAuthConfigured } from "@/lib/connectors/oauth/platform";
import { createOAuthState } from "@/lib/connectors/oauth/state";
import { isConnectorId } from "@/lib/connectors/types";
import { getAppUrl } from "@/lib/env";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

type RouteContext = {
  params: Promise<{ connectorId: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
  if (!access.allowed || !canManageOrganizationSettings(session)) {
    return NextResponse.redirect(new URL("/automation/connectors?error=access", getAppUrl()));
  }

  const { connectorId: rawConnectorId } = await context.params;
  if (!isConnectorId(rawConnectorId)) {
    return NextResponse.redirect(new URL("/automation/connectors?error=unknown", getAppUrl()));
  }

  bootstrapConnectors();
  const config = getConnectorConfig(rawConnectorId);
  if (!config || config.oauth === "none") {
    return NextResponse.redirect(new URL("/automation/connectors?error=oauth", getAppUrl()));
  }

  if (!isConnectorOAuthConfigured(config)) {
    return NextResponse.redirect(new URL("/automation/connectors?error=not_configured", getAppUrl()));
  }

  const redirectUri = `${getAppUrl()}/api/connectors/oauth/${rawConnectorId}/callback`;
  const stateRecord = await createOAuthState({
    organizationId: session.organization.id,
    connectorId: rawConnectorId,
    redirectUri,
    scopes: [...config.defaultScopes],
    createdBy: session.user.id,
    usePkce: config.oauth === "oauth2_pkce",
  });

  const authorizeUrl = buildAuthorizeUrl(config, {
    connectorId: rawConnectorId,
    redirectUri,
    state: stateRecord.stateToken,
    scopes: stateRecord.scopes,
    codeVerifier: stateRecord.codeVerifier,
  });

  return NextResponse.redirect(authorizeUrl);
}
