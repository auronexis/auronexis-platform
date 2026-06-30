import { EmptyState } from "@/components/ui/empty-state";
import { ACCESS_DENIED_MESSAGE } from "@/lib/authorization/guards";

type AccessDeniedProps = {
  message?: string;
};

export function AccessDenied({ message = ACCESS_DENIED_MESSAGE }: AccessDeniedProps) {
  return (
    <EmptyState
      title={message}
      description="Contact your workspace owner or admin if you need access."
    />
  );
}
