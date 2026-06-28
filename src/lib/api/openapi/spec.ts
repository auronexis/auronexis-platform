import { OPENAPI_VERSION } from "@/lib/api/types";
import { API_BASE_PATH } from "@/lib/api/versioning/constants";

export function buildOpenApiSpec() {
  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "Auroranexis Public API",
      version: "1.0.0",
      description:
        "Enterprise REST API for clients, reports, risks, incidents, automation, AI, and integrations.",
    },
    servers: [{ url: API_BASE_PATH }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description: "Use `Authorization: Bearer anx_live_...`",
        },
      },
      schemas: {
        PaginatedClients: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Client" } },
            nextCursor: { type: "string", nullable: true },
            hasMore: { type: "boolean" },
          },
        },
        Client: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            status: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/clients": {
        get: {
          summary: "List clients",
          tags: ["Clients"],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
            { name: "cursor", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Paginated clients",
              content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedClients" } } },
            },
            "401": { description: "Unauthorized" },
            "429": { description: "Rate limited" },
          },
        },
        post: { summary: "Create client", tags: ["Clients"], responses: { "201": { description: "Created" } } },
      },
      "/reports": { get: { summary: "List reports", tags: ["Reports"] } },
      "/risks": { get: { summary: "List risks", tags: ["Risks"] } },
      "/incidents": { get: { summary: "List incidents", tags: ["Incidents"] } },
      "/automation": { get: { summary: "List workflows", tags: ["Automation"] } },
      "/predictive": { get: { summary: "Organization predictive intelligence", tags: ["Predictive"] } },
      "/ai": { post: { summary: "Execute AI task", tags: ["AI"] } },
      "/integrations": { get: { summary: "Integration summary", tags: ["Integrations"] } },
    },
  };
}
