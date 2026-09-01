import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";
import { loadArchivedEInvoiceForDownload } from "@/lib/einvoice-archive/archive";
import { createProductionArchivePorts } from "@/lib/einvoice-archive/supabase-ports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!session || !canAccessEInvoiceArchive(session)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const result = await loadArchivedEInvoiceForDownload(
    {
      organizationId: session.organization.id,
      archiveId: id,
      actorUserId: session.user.id,
    },
    createProductionArchivePorts(),
  );

  if (!result.ok) {
    if (result.code === "HASH_MISMATCH") {
      return NextResponse.json({ error: "Integrity verification failed." }, { status: 409 });
    }
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  void _request;
  return new Response(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
