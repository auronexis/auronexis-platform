import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import {
  buttonBaseStyles,
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/ui/button-styles";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Link styled as a button — avoids invalid button-inside-anchor markup. */
export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        buttonBaseStyles,
        transitionInteractive,
        focusRing,
        pressable,
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
