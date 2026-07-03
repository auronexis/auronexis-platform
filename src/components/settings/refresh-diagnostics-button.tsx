"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshDiagnosticsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={isPending}
      aria-label="Refresh diagnostics"
      onClick={() => startTransition(() => router.refresh())}
    >
      Refresh diagnostics
    </Button>
  );
}
