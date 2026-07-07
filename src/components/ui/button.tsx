import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-interactive active:shadow-sm",
  secondary:
    "border border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-hover hover:shadow-md active:shadow-sm",
  ghost:
    "border border-transparent bg-transparent text-foreground hover:bg-muted/10 hover:text-foreground active:bg-muted/15",
  outline:
    "border border-border bg-surface text-foreground shadow-xs hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-sm active:bg-primary/[0.06]",
  danger:
    "border border-transparent bg-danger text-danger-foreground shadow-xs hover:bg-danger-hover hover:shadow-md active:shadow-sm",
  success:
    "border border-transparent bg-success text-success-foreground shadow-xs hover:bg-success-hover hover:shadow-md active:shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

const disabledBase =
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none";

const disabledVariantStyles: Record<ButtonVariant, string> = {
  primary:
    "disabled:bg-primary/55 disabled:text-primary-foreground disabled:opacity-100 disabled:hover:bg-primary/55",
  secondary:
    "disabled:bg-secondary/50 disabled:text-secondary-foreground/90 disabled:opacity-100 disabled:hover:bg-secondary/50",
  ghost:
    "disabled:bg-transparent disabled:text-muted disabled:opacity-100 disabled:hover:bg-transparent",
  outline:
    "disabled:border-border disabled:bg-surface/90 disabled:text-muted disabled:opacity-100 disabled:hover:bg-surface/90",
  danger:
    "disabled:bg-danger/50 disabled:text-danger-foreground disabled:opacity-100 disabled:hover:bg-danger/50",
  success:
    "disabled:bg-success/50 disabled:text-success-foreground disabled:opacity-100 disabled:hover:bg-success/50",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center font-medium",
        transitionInteractive,
        focusRing,
        pressable,
        disabledBase,
        disabledVariantStyles[variant],
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden>
            <Spinner size="sm" className="text-current" />
          </span>
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
