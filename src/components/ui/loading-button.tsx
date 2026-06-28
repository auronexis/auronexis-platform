import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

type LoadingButtonProps = ButtonProps & {
  loading: boolean;
  loadingText?: string;
};

/** Button with built-in loading spinner — foundation primitive for async actions. */
export function LoadingButton({
  loading,
  loadingText,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button loading={loading} loadingText={loadingText} disabled={disabled || loading} {...props}>
      {children}
    </Button>
  );
}
