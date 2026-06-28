import "server-only";

import { countDeliveryLogsByStatus } from "@/lib/integrations/execution/logging";

let inMemoryQueueSize = 0;

export function incrementQueueSize(): void {
  inMemoryQueueSize += 1;
}

export function decrementQueueSize(): void {
  inMemoryQueueSize = Math.max(0, inMemoryQueueSize - 1);
}

export function getInMemoryQueueSize(): number {
  return inMemoryQueueSize;
}

export async function getPendingQueueSize(organizationId: string): Promise<number> {
  const [queued, sending, retrying] = await Promise.all([
    countDeliveryLogsByStatus(organizationId, "queued"),
    countDeliveryLogsByStatus(organizationId, "sending"),
    countDeliveryLogsByStatus(organizationId, "retrying"),
  ]);

  return queued + sending + retrying + getInMemoryQueueSize();
}
