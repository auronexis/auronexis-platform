import { NextResponse } from "next/server";

import {
  analyzeMollieDuplicatePaidFirstPayments,
  recoverMolliePaidFreshPurchase,
} from "@/lib/billing/providers/mollie/paid-purchase-recovery";
import { isMollieLiveChargingEnabled } from "@/lib/billing/providers/mollie/rollout";
import { getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";
import { verifyCronAuthorization } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecoveryAction = "recover" | "analyze-duplicates";

type RecoveryRequestBody = {
  action: RecoveryAction;
  organizationId: string;
  paymentId?: string;
  customerId?: string;
};

function parseBody(raw: unknown): RecoveryRequestBody | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const body = raw as Record<string, unknown>;
  const action = body.action;
  const organizationId = body.organizationId;
  if (action !== "recover" && action !== "analyze-duplicates") {
    return null;
  }
  if (typeof organizationId !== "string" || organizationId.trim().length < 8) {
    return null;
  }
  return {
    action,
    organizationId: organizationId.trim(),
    paymentId: typeof body.paymentId === "string" ? body.paymentId.trim() : undefined,
    customerId: typeof body.customerId === "string" ? body.customerId.trim() : undefined,
  };
}

/**
 * Operator-only Mollie paid-purchase recovery (Recovery V3).
 * Requires Bearer CRON_SECRET — no session shortcut (mutates billing state).
 *
 * POST { "action": "recover", "organizationId": "<uuid>", "paymentId": "tr_..." }
 * POST { "action": "analyze-duplicates", "organizationId": "<uuid>", "customerId": "cst_..." }
 */
export async function POST(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const credentialMode = getMollieCredentialMode();
  if (credentialMode === "live" && isMollieLiveChargingEnabled()) {
    return NextResponse.json(
      { error: "Operator recovery is blocked while MOLLIE_LIVE_CHARGING_ENABLED is true." },
      { status: 403 },
    );
  }

  let body: RecoveryRequestBody | null;
  try {
    body = parseBody(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Invalid body. Use action recover (organizationId, paymentId) or analyze-duplicates (organizationId, customerId).",
      },
      { status: 400 },
    );
  }

  try {
    if (body.action === "recover") {
      if (!body.paymentId?.startsWith("tr_")) {
        return NextResponse.json({ error: "paymentId must be a Mollie tr_ id." }, { status: 400 });
      }

      const result = await recoverMolliePaidFreshPurchase({
        organizationId: body.organizationId,
        paymentId: body.paymentId,
      });

      console.info("[billing][operator-recovery] recover", {
        organizationIdPrefix: body.organizationId.slice(0, 8),
        paymentIdPrefix: body.paymentId.slice(0, 12),
        recovered: result.recovered,
        reason: result.recovered ? undefined : result.reason,
      });

      return NextResponse.json({ ok: true, action: "recover", result });
    }

    if (!body.customerId?.startsWith("cst_")) {
      return NextResponse.json({ error: "customerId must be a Mollie cst_ id." }, { status: 400 });
    }

    const duplicates = await analyzeMollieDuplicatePaidFirstPayments({
      organizationId: body.organizationId,
      customerId: body.customerId,
    });

    console.info("[billing][operator-recovery] analyze-duplicates", {
      organizationIdPrefix: body.organizationId.slice(0, 8),
      customerIdPrefix: body.customerId.slice(0, 12),
      matchCount: duplicates.length,
    });

    return NextResponse.json({
      ok: true,
      action: "analyze-duplicates",
      duplicateCount: duplicates.length,
      payments: duplicates,
      operatorNote:
        duplicates.length > 1
          ? "Multiple paid first payments detected. Recover using the latest tr_ only. Decide refund/credit manually on earlier payments — no auto-refund."
          : "No duplicate paid first payments detected for this customer.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operator recovery failed.";
    console.error("[billing][operator-recovery] failed", {
      organizationIdPrefix: body.organizationId.slice(0, 8),
      message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
