import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type ApiEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ApiEmptyState({ title, description, action }: ApiEmptyStateProps) {
  return <EmptyState title={title} description={description} action={action} />;
}
