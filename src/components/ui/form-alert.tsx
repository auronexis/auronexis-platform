import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type FormAlertProps = {
  variant: "error" | "success" | "warning";
  children: ReactNode;
  className?: string;
};

export function FormAlert({ variant, children, className }: FormAlertProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        variant === "error" && "border-danger/20 bg-danger/5 text-danger",
        variant === "success" && "border-success/20 bg-success/10 text-success",
        variant === "warning" && "border-warning/20 bg-warning/10 text-warning",
        className,
      )}
    >
      {children}
    </p>
  );
}
