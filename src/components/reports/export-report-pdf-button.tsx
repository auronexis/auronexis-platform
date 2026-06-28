import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type ExportReportPdfButtonProps = {
  reportId: string;
};

export function ExportReportPdfButton({ reportId }: ExportReportPdfButtonProps) {
  return (
    <Link
      href={`/reports/${reportId}/export`}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "bg-accent-blue text-white hover:bg-accent-blue-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
      )}
    >
      Export PDF
    </Link>
  );
}
