"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveClientButton } from "@/components/clients/archive-client-button";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { rowInteractiveClass } from "@/components/ui/interactive-surface";
import { archiveClientAction } from "@/lib/clients/actions";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ClientRowActionsProps = {
  clientId: string;
  clientName: string;
  canManage: boolean;
  canHardDelete?: boolean;
  isArchived: boolean;
  variant?: "table" | "detail";
};

export function ClientRowActions({
  clientId,
  clientName,
  canManage,
  canHardDelete = false,
  isArchived,
  variant = "table",
}: ClientRowActionsProps) {
  const router = useRouter();
  const showHardDelete = canHardDelete && isArchived;

  if (!canManage && !showHardDelete) {
    return null;
  }

  if (variant === "detail") {
    return (
      <div className="flex flex-wrap gap-2">
        {canManage && !isArchived ? (
          <ArchiveClientButton clientId={clientId} clientName={clientName} />
        ) : null}
        {showHardDelete ? (
          <DeleteClientButton clientId={clientId} clientName={clientName} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/clients/${clientId}`}
        data-row-interactive
        className={cn(rowInteractiveClass, linkText, "text-xs font-medium no-underline hover:underline")}
      >
        Edit
      </Link>
      {canManage && !isArchived ? (
        <ConfirmActionButton
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          dialogTitle="Archive client"
          dialogDescription={`Archive ${clientName}? The client will be hidden from the active list.`}
          dialogConsequences="Historical data, reports, and activity remain in the system. Permanent delete is available only after archive, for owners and admins."
          confirmLabel="Archive"
          successToast={`${clientName} archived`}
          onConfirm={async () => {
            await archiveClientAction(clientId, { redirectTo: false });
            router.refresh();
          }}
        >
          Archive
        </ConfirmActionButton>
      ) : null}
      {showHardDelete ? (
        <DeleteClientButton
          clientId={clientId}
          clientName={clientName}
          size="sm"
          className="h-7 px-2 text-xs"
          onDeleted={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
