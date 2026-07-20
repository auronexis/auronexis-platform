/** Shared button chrome — Button and LinkButton must stay in sync. */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export const buttonVariantStyles: Record<ButtonVariant, string> = {
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

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

export const buttonBaseStyles = "inline-flex items-center justify-center font-medium";
