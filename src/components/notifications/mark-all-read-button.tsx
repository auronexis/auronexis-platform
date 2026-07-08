"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllNotificationsReadButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleMarkAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.error) {
        toast({ title: result.error, variant: "error" });
        return;
      }

      toast({ title: "All notifications marked as read", variant: "success" });
    });
  }

  return (
    <Button type="button" variant="secondary" disabled={isPending} onClick={handleMarkAll}>
      {isPending ? "Updating…" : "Mark all as read"}
    </Button>
  );
}
