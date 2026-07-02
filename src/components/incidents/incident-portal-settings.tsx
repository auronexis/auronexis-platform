"use client";

import { useActionState } from "react";
import { updateIncidentPortalSettingsAction } from "@/lib/incidents/portal-actions";
import { Button } from "@/components/ui/button";

type IncidentPortalSettingsProps = {
  incidentId: string;
  portalVisible: boolean;
  clientSummary: string | null;
};

export function IncidentPortalSettings({
  incidentId,
  portalVisible,
  clientSummary,
}: IncidentPortalSettingsProps) {
  const boundAction = updateIncidentPortalSettingsAction.bind(null, incidentId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          name="portal_visible"
          defaultChecked={portalVisible}
          className="h-4 w-4 rounded border-border"
        />
        Visible in client portal
      </label>

      <div>
        <label htmlFor="client_summary" className="text-sm font-medium text-foreground">
          Client-facing summary
        </label>
        <textarea
          id="client_summary"
          name="client_summary"
          rows={4}
          defaultValue={clientSummary ?? ""}
          placeholder="Share a client-safe summary of this incident."
          className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save portal settings"}
      </Button>
    </form>
  );
}
