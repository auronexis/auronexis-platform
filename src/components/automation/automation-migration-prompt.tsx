"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";

type AutomationMigrationPromptProps = {
  workflowCount: number;
  executionCount: number;
  onMigrate: () => Promise<void>;
  onDismiss: () => void;
};

export function AutomationMigrationPrompt({
  workflowCount,
  executionCount,
  onMigrate,
  onDismiss,
}: AutomationMigrationPromptProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {error ? (
        <div className="mb-4">
          <FormAlert variant="error">{error}</FormAlert>
        </div>
      ) : null}
      <ConfirmDialog
        open
        onOpenChange={(open) => {
          if (!open) onDismiss();
        }}
        title="Migrate local automations"
        description={`We found ${workflowCount} workflow${workflowCount === 1 ? "" : "s"} and ${executionCount} execution record${executionCount === 1 ? "" : "s"} saved in this browser.`}
        consequences="Import them into secure workspace storage to keep them across devices. Your local drafts are only cleared after a successful import."
        confirmLabel={isPending ? "Migrating…" : "Import to workspace"}
        cancelLabel="Not now"
        variant="primary"
        loading={isPending}
        onConfirm={() => {
          setError(null);
          startTransition(async () => {
            try {
              await onMigrate();
            } catch (migrateError) {
              setError(
                migrateError instanceof Error
                  ? migrateError.message
                  : "Migration failed. Your local drafts were not deleted.",
              );
            }
          });
        }}
      />
    </>
  );
}
