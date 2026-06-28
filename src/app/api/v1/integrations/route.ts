import type { NextRequest } from "next/server";
import { getIntegrationsDashboardSummary } from "@/lib/integrations/queries";
import { listConnectorConnections } from "@/lib/connectors/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["integrations.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const [summary, connections] = await Promise.all([
        getIntegrationsDashboardSummary({
          organizationId: ctx.organization.id,
          userId: ctx.userId ?? ctx.organization.id,
        }),
        listConnectorConnections(session),
      ]);

      return apiJson({
        integrations: summary,
        connectors: connections.map((item) => ({
          id: item.id,
          connectorId: item.connectorId,
          displayName: item.displayName,
          status: item.status,
          lastSyncAt: item.lastSyncAt,
          healthStatus: item.healthStatus,
        })),
      });
    },
  });
}
