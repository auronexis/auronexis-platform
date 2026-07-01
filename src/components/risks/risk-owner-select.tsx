"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { assignRiskOwnerAction } from "@/lib/risks/actions";
import type { AppUser } from "@/types/database";

type RiskOwnerSelectProps = {
  riskId: string;
  currentOwnerId: string | null;
  orgUsers: Pick<AppUser, "id" | "full_name">[];
  disabled?: boolean;
};

export function RiskOwnerSelect({
  riskId,
  currentOwnerId,
  orgUsers,
  disabled = false,
}: RiskOwnerSelectProps) {
  const [isPending, startTransition] = useTransition();

  if (orgUsers.length === 0) {
    return null;
  }

  return (
    <Select
      id="riskOwnerSelect"
      name="riskOwnerSelect"
      label="Risk owner"
      disabled={disabled || isPending}
      defaultValue={currentOwnerId ?? orgUsers[0]?.id ?? ""}
      options={orgUsers.map((user) => ({ value: user.id, label: user.full_name }))}
      onChange={(event) => {
        const ownerUserId = event.target.value;
        if (!ownerUserId || ownerUserId === currentOwnerId) {
          return;
        }

        startTransition(async () => {
          await assignRiskOwnerAction(riskId, ownerUserId);
        });
      }}
    />
  );
}
