"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { resolveActionError } from "@/lib/action-errors";
import { getClientById } from "@/lib/clients/queries";
import { createClient } from "@/lib/supabase/server";
import {
  canAssignCustomerSuccess,
  canCompleteCustomerSuccess,
  canWriteCustomerSuccess,
} from "@/lib/customer-success/guards";
import { getPlaybookDefinition } from "@/lib/customer-success/constants";
import {
  getPlaybookInstanceById,
  listTasksForPlaybook,
  type PlaybookInstanceRow,
} from "@/lib/customer-success/queries";
import {
  allRequiredTasksComplete,
  buildTaskRowsFromPlaybook,
  computePlaybookDueAt,
} from "@/lib/customer-success/task-engine";
import { buildClientSuccessSnapshot } from "@/lib/customer-success/snapshot";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import type { CustomerSuccessActionResult } from "@/lib/customer-success/types";
import type { PostgrestError } from "@supabase/supabase-js";

function logActionError(
  operation: string,
  organizationId: string,
  error: PostgrestError,
  extra?: Record<string, string | undefined>,
): void {
  console.error("[customer_success_action]", {
    operation,
    organization_id: organizationId,
    ...extra,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

async function revalidateSuccessPaths(clientId?: string): Promise<void> {
  revalidatePath("/customer-success");
  revalidatePath("/dashboard");
  if (clientId) {
    revalidatePath(`/clients/${clientId}/success`);
    revalidatePath(`/clients/${clientId}`);
  }
}

export async function startPlaybookAction(input: {
  clientId: string;
  playbookKey: string;
  triggerCode?: string;
  assignedToUserId?: string;
}): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canWriteCustomerSuccess(session)) {
      return { success: false, error: "You do not have permission to start playbooks." };
    }

    const client = await getClientById(session, input.clientId);
    if (!client) return { success: false, error: "Client not found." };

    const definition = getPlaybookDefinition(input.playbookKey);
    if (!definition) return { success: false, error: "Unknown playbook." };

    const planContext = await getOrganizationPlanContextForSession(session);
    const snapshot = await buildClientSuccessSnapshot({
      session,
      clientId: input.clientId,
      planContext,
    });

    const supabase = await createClient();
    const now = new Date().toISOString();
    const dueAt = computePlaybookDueAt(input.playbookKey);

    const { data: instance, error: insertError } = await supabase
      .from("customer_success_playbook_instances")
      .insert({
        organization_id: session.organization.id,
        client_id: input.clientId,
        playbook_key: input.playbookKey,
        status: "active",
        priority: definition.defaultPriority,
        assigned_to_user_id: input.assignedToUserId ?? null,
        started_by_user_id: session.user.id,
        started_at: now,
        due_at: dueAt,
        trigger_code: input.triggerCode ?? null,
        recovery_score_before: snapshot?.healthScore ?? null,
      } as never)
      .select("*")
      .single();

    if (insertError || !instance) {
      logActionError("start_playbook", session.organization.id, insertError!, {
        client_id: input.clientId,
      });
      return { success: false, error: "Unable to start playbook." };
    }

    const inst = instance as PlaybookInstanceRow;
    const taskRows = buildTaskRowsFromPlaybook(inst);
    if (taskRows.length > 0) {
      const { error: taskError } = await supabase
        .from("customer_success_tasks")
        .insert(taskRows as never[]);
      if (taskError) {
        logActionError("create_playbook_tasks", session.organization.id, taskError, {
          playbook_instance_id: inst.id,
        });
      }
    }

    await revalidateSuccessPaths(input.clientId);
    return { success: true, data: { instanceId: inst.id } };
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to start playbook." };
  }
}

async function updatePlaybookStatus(
  instanceId: string,
  status: string,
  extra?: Record<string, string | null>,
): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canWriteCustomerSuccess(session)) {
      return { success: false, error: "Insufficient permissions." };
    }

    const instance = await getPlaybookInstanceById(session.organization.id, instanceId);
    if (!instance) return { success: false, error: "Playbook not found." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("customer_success_playbook_instances")
      .update({ status, ...extra } as never)
      .eq("id", instanceId)
      .eq("organization_id", session.organization.id);

    if (error) {
      logActionError("update_playbook_status", session.organization.id, error, {
        playbook_instance_id: instanceId,
      });
      return { success: false, error: "Unable to update playbook." };
    }

    await revalidateSuccessPaths(instance.client_id);
    return { success: true, data: { instanceId } };
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to update playbook." };
  }
}

export async function pausePlaybookAction(instanceId: string): Promise<CustomerSuccessActionResult> {
  return updatePlaybookStatus(instanceId, "paused");
}

export async function resumePlaybookAction(instanceId: string): Promise<CustomerSuccessActionResult> {
  return updatePlaybookStatus(instanceId, "active");
}

export async function cancelPlaybookAction(instanceId: string): Promise<CustomerSuccessActionResult> {
  return updatePlaybookStatus(instanceId, "cancelled", {
    cancelled_at: new Date().toISOString(),
  });
}

export async function completePlaybookAction(
  instanceId: string,
  outcome?: string,
): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canCompleteCustomerSuccess(session)) {
      return { success: false, error: "You do not have permission to complete playbooks." };
    }

    const instance = await getPlaybookInstanceById(session.organization.id, instanceId);
    if (!instance) return { success: false, error: "Playbook not found." };

    const tasks = await listTasksForPlaybook(session.organization.id, instanceId);
    if (!allRequiredTasksComplete(tasks)) {
      return { success: false, error: "Complete all required tasks before closing the playbook." };
    }

    const planContext = await getOrganizationPlanContextForSession(session);
    const snapshot = await buildClientSuccessSnapshot({
      session,
      clientId: instance.client_id,
      planContext,
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from("customer_success_playbook_instances")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        outcome: outcome ?? "completed",
        recovery_score_after: snapshot?.healthScore ?? null,
      } as never)
      .eq("id", instanceId)
      .eq("organization_id", session.organization.id);

    if (error) {
      logActionError("complete_playbook", session.organization.id, error, {
        playbook_instance_id: instanceId,
      });
      return { success: false, error: "Unable to complete playbook." };
    }

    await revalidateSuccessPaths(instance.client_id);
    return { success: true, data: { instanceId } };
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to complete playbook." };
  }
}

export async function assignPlaybookAction(
  instanceId: string,
  assignedToUserId: string | null,
): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canAssignCustomerSuccess(session)) {
      return { success: false, error: "You do not have permission to assign playbooks." };
    }
    return updatePlaybookStatus(instanceId, "active", {
      assigned_to_user_id: assignedToUserId,
    });
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to assign playbook." };
  }
}

export async function completeTaskAction(taskId: string): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canCompleteCustomerSuccess(session)) {
      return { success: false, error: "You do not have permission to complete tasks." };
    }

    const supabase = await createClient();
    const { data: task, error: fetchError } = await supabase
      .from("customer_success_tasks")
      .select("id, client_id, organization_id, status")
      .eq("id", taskId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    if (fetchError || !task) {
      return { success: false, error: "Task not found." };
    }

    const row = task as { id: string; client_id: string; status: string };
    if (row.status === "completed") {
      return { success: true, data: { taskId } };
    }

    const { error } = await supabase
      .from("customer_success_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by_user_id: session.user.id,
      } as never)
      .eq("id", taskId)
      .eq("organization_id", session.organization.id);

    if (error) {
      logActionError("complete_task", session.organization.id, error, { client_id: row.client_id });
      return { success: false, error: "Unable to complete task." };
    }

    await revalidateSuccessPaths(row.client_id);
    return { success: true, data: { taskId } };
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to complete task." };
  }
}

export async function skipTaskAction(taskId: string): Promise<CustomerSuccessActionResult> {
  try {
    const session = await requireSession();
    if (!canWriteCustomerSuccess(session)) {
      return { success: false, error: "Insufficient permissions." };
    }

    const supabase = await createClient();
    const { data: task } = await supabase
      .from("customer_success_tasks")
      .select("id, client_id, required")
      .eq("id", taskId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    const row = task as { id: string; client_id: string; required: boolean } | null;
    if (!row) return { success: false, error: "Task not found." };
    if (row.required) return { success: false, error: "Required tasks cannot be skipped." };

    const { error } = await supabase
      .from("customer_success_tasks")
      .update({ status: "skipped" } as never)
      .eq("id", taskId);

    if (error) {
      logActionError("skip_task", session.organization.id, error);
      return { success: false, error: "Unable to skip task." };
    }

    await revalidateSuccessPaths(row.client_id);
    return { success: true, data: { taskId } };
  } catch (err) {
    const resolved = resolveActionError(err);
    return { success: false, error: resolved.error ?? "Unable to skip task." };
  }
}
