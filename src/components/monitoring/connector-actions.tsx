"use client";

import { useTransition } from "react";
import {
  archiveMonitoringConnectorAction,
  checkMonitoringConnectorAction,
  pauseMonitoringConnectorAction,
  resumeMonitoringConnectorAction,
  simulateMonitoringEventAction,
} from "@/lib/monitoring/actions";
import { Button } from "@/components/ui/button";

type ConnectorActionsProps = {
  connectorId: string;
  status: string;
  canManage: boolean;
};

export function ConnectorActions({ connectorId, status, canManage }: ConnectorActionsProps) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(() => {
      void action();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => run(() => checkMonitoringConnectorAction(connectorId))}
      >
        Run health check
      </Button>

      {canManage && status === "paused" ? (
        <Button
          type="button"
          disabled={pending}
          onClick={() => run(() => resumeMonitoringConnectorAction(connectorId))}
        >
          Resume
        </Button>
      ) : null}

      {canManage && status !== "paused" && status !== "archived" ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => pauseMonitoringConnectorAction(connectorId))}
        >
          Pause
        </Button>
      ) : null}

      {canManage && status !== "archived" ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => archiveMonitoringConnectorAction(connectorId))}
        >
          Archive
        </Button>
      ) : null}

      {canManage ? (
        <form
          action={(formData) => {
            startTransition(() => {
              void simulateMonitoringEventAction(connectorId, formData);
            });
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="text-xs font-medium text-muted">
            Simulate
            <select name="severity" className="ml-2 rounded-lg border border-border px-2 py-1 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <Button type="submit" variant="secondary" disabled={pending}>
            Simulate event
          </Button>
        </form>
      ) : null}
    </div>
  );
}
