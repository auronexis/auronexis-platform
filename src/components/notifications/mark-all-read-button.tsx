"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllNotificationsReadButton() {
  const [isPending, startTransition] = useTransition();

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <Button type="button" variant="secondary" disabled={isPending} onClick={handleMarkAll}>
      {isPending ? "Updating…" : "Mark all as read"}
    </Button>
  );
}
