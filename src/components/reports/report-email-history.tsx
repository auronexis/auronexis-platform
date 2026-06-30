import type { ReportEmailDeliveryView } from "@/lib/reports/email-types";
import {
  DELIVERY_STATUS_LABELS,
  formatDeliveryDateTime,
} from "@/lib/reports/email-types";

type ReportEmailHistoryProps = {
  deliveries: ReportEmailDeliveryView[];
};

export function ReportEmailHistory({ deliveries }: ReportEmailHistoryProps) {
  if (deliveries.length === 0) {
    return (
      <p className="text-sm text-muted">No email deliveries recorded for this report yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Recipient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Sent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Resend ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Error
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                {delivery.recipient_email}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={
                    delivery.status === "sent"
                      ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                      : delivery.status === "failed"
                        ? "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-critical"
                        : "inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-warning"
                  }
                >
                  {DELIVERY_STATUS_LABELS[delivery.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                {formatDeliveryDateTime(delivery.sent_at ?? delivery.created_at)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-muted">
                {delivery.resend_message_id ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-critical">
                {delivery.error_message ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
