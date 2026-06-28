import { cn } from "@/lib/utils/cn";

type SeatLimitWarningProps = {
  message: string;
  className?: string;
};

export function SeatLimitWarning({ message, className }: SeatLimitWarningProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-warning",
        className,
      )}
    >
      {message}
    </div>
  );
}
