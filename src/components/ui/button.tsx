import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import {
  buttonBaseStyles,
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/ui/button-styles";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";

export type { ButtonSize, ButtonVariant };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
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
        "relative",
        buttonBaseStyles,
        transitionInteractive,
        focusRing,
        pressable,
        disabledBase,
        disabledVariantStyles[variant],
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
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
