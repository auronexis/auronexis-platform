import type { ReportEmailDelivery } from "@/types/database";
import { formatAppDateTime } from "@/lib/i18n";

export type ReportEmailDeliveryStatus = ReportEmailDelivery["status"];

export type ReportEmailDeliveryView = ReportEmailDelivery;

export const DELIVERY_STATUS_LABELS: Record<ReportEmailDeliveryStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
};

export function formatDeliveryDateTime(value: string | null | undefined): string {
  return formatAppDateTime(value);
}
