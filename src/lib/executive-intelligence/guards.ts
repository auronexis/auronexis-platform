import { sessionHasPermission } from "@/lib/authorization/guards";
import type { SessionContext } from "@/lib/tenancy/context";

export function canReadExecutiveIntelligence(session: SessionContext): boolean {
  return sessionHasPermission(session, "executive_intelligence.read");
}

export function canGenerateExecutiveIntelligence(session: SessionContext): boolean {
  return sessionHasPermission(session, "executive_intelligence.generate");
}

export function canRefreshExecutiveIntelligence(session: SessionContext): boolean {
  return sessionHasPermission(session, "executive_intelligence.refresh");
}

export function canExportExecutiveIntelligence(session: SessionContext): boolean {
  return sessionHasPermission(session, "executive_intelligence.export");
}

export function canManageExecutiveIntelligence(session: SessionContext): boolean {
  return sessionHasPermission(session, "executive_intelligence.manage");
}
