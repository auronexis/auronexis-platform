import type { ReportEmailDelivery } from "@/types/database";

export type ReportEmailDeliveryStatus = ReportEmailDelivery["status"];

export type ReportEmailDeliveryView = ReportEmailDelivery;

export const DELIVERY_STATUS_LABELS: Record<ReportEmailDeliveryStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
};

export function formatDeliveryDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
