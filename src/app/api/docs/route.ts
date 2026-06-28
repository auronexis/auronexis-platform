import { buildOpenApiSpec } from "@/lib/api/openapi/spec";

export async function GET(): Promise<Response> {
  const spec = buildOpenApiSpec();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Auroranexis API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
