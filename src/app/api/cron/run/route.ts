import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/env";
import { dispatchDueJobs, dispatchJob } from "@/lib/jobs/dispatcher";
import type { JobId } from "@/lib/jobs/types";
import { listRegisteredJobIds } from "@/lib/jobs/registry";
import { runIndexNowForCron } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

/**
 * Cron dispatcher — requires Bearer CRON_SECRET.
 * GET is the Vercel Cron entrypoint; POST supports manual ops.
 * Optional `?job=<id>` forces a single registered job.
 * Optional `?probe=1` lists registered job IDs without execution.
 * Daily IndexNow submission runs in-process during the UTC 06:00–06:04 window.
 */
async function handleCron(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("probe") === "1") {
    return NextResponse.json({
      ok: true,
      jobs: listRegisteredJobIds(),
    });
  }

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
    const indexNow = await runIndexNowForCron();
    return NextResponse.json({ ok: true, results, indexNow });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron dispatch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleCron(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCron(request);
}
