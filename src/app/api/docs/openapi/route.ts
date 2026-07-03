import { buildOpenApiSpec } from "@/lib/api/openapi/spec";

export async function GET(): Promise<Response> {
  const spec = buildOpenApiSpec();

  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
