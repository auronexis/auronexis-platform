import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateNotificationInput } from "@/lib/notifications/types";
import type { Database, UserRole } from "@/types/database";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

/** Insert a notification for a single user (service role). */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient();

  const payload: NotificationInsert = {
    organization_id: input.organizationId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
  };

  const { error } = await admin.from("notifications").insert(payload as never);

  if (error) {
    console.error("[notifications] create failed:", error.message);
  }
}

/** Notify one user by ID. */
export async function createNotificationForUser(
  input: CreateNotificationInput,
): Promise<void> {
  await createNotification(input);
}

/** Notify all active users in an org with a given role. */
export async function createNotificationForRole(
  organizationId: string,
  role: UserRole,
  input: Omit<CreateNotificationInput, "organizationId" | "userId">,
): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role", role)
    .eq("is_disabled", false);

  if (error) {
    console.error("[notifications] role lookup failed:", error.message);
    return;
  }

  const users = (data ?? []) as { id: string }[];

  await Promise.all(
    users.map((user) =>
      createNotification({
        organizationId,
        userId: user.id,
        ...input,
      }),
    ),
  );
}

/** Notify all active owners and admins in an organization. */
export async function createNotificationForOwnersAndAdmins(
  organizationId: string,
  input: Omit<CreateNotificationInput, "organizationId" | "userId">,
): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin"])
    .eq("is_disabled", false);

  if (error) {
    console.error("[notifications] owners/admins lookup failed:", error.message);
    return;
  }

  const users = (data ?? []) as { id: string }[];

  await Promise.all(
    users.map((user) =>
      createNotification({
        organizationId,
        userId: user.id,
        ...input,
      }),
    ),
  );
}

/** Notify owners/admins plus an optional assigned user (deduplicated). */
export async function createNotificationForOwnersAdminsAndAssignee(
  organizationId: string,
  assigneeUserId: string | null | undefined,
  input: Omit<CreateNotificationInput, "organizationId" | "userId">,
): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin"])
    .eq("is_disabled", false);

  if (error) {
    console.error("[notifications] owners/admins lookup failed:", error.message);
    return;
  }

  const userIds = new Set((data ?? []).map((row) => (row as { id: string }).id));

  if (assigneeUserId) {
    userIds.add(assigneeUserId);
  }

  await Promise.all(
    [...userIds].map((userId) =>
      createNotification({
        organizationId,
        userId,
        ...input,
      }),
    ),
  );
}
