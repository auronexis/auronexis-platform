import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/env";
import { dispatchDueJobs, dispatchJob } from "@/lib/jobs/dispatcher";
import type { JobId } from "@/lib/jobs/types";
import { listRegisteredJobIds } from "@/lib/jobs/registry";

export const runtime = "nodejs";

/** Cron endpoint — invoke registered background jobs. Requires Bearer CRON_SECRET. */
export async function POST(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const jobParam = url.searchParams.get("job");

  try {
    if (jobParam) {
      const jobIds = listRegisteredJobIds();
      if (!jobIds.includes(jobParam as JobId)) {
        return NextResponse.json({ error: "Unknown job." }, { status: 400 });
      }
      const result = await dispatchJob(jobParam as JobId, { force: true });
      return NextResponse.json({ ok: true, results: [result] });
    }

    const results = await dispatchDueJobs();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron dispatch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Health probe for cron infrastructure (no job execution). */
export async function GET(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    jobs: listRegisteredJobIds(),
  });
}
