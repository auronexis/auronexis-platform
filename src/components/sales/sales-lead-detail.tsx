"use client";

import { useActionState } from "react";
import type { SalesLeadWithMeta } from "@/lib/sales/queries";
import type { SalesLeadActivity, SalesLeadReminder } from "@/types/database";
import {
  PIPELINE_STAGES,
  SALES_ACTIVITY_TYPES,
  getLeadSourceLabel,
} from "@/lib/sales/pipeline-stages";
import { PipelineStageBadge } from "@/components/sales/pipeline-stage-badge";
import { OUTBOUND_LIST_TYPES } from "@/lib/sales/outbound-lists";
import { AGENCY_TYPES, LEAD_SOURCE_REGIONS } from "@/lib/sales/lead-sourcing";
import {
  addSalesLeadActivity,
  addSalesLeadNote,
  archiveSalesLead,
  changeLeadStage,
  completeLeadReminder,
  createSalesProposal,
  enrollFoundingCustomer,
  scheduleLeadFollowup,
  startCustomerOnboarding,
  updateSalesLead,
  type SalesActionState,
} from "@/lib/sales/actions";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import { formatAppDateTime } from "@/lib/i18n/date";
import type { TeamMemberView } from "@/lib/team/types";

const initialState: SalesActionState = {};

type SalesLeadDetailProps = {
  lead: SalesLeadWithMeta;
  activities: SalesLeadActivity[];
  reminders: SalesLeadReminder[];
  teamMembers: TeamMemberView[];
  canManage: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return formatAppDateTime(value);
}

export function SalesLeadDetail({
  lead,
  activities,
  reminders,
  teamMembers,
  canManage,
}: SalesLeadDetailProps) {
  const [updateState, updateAction, updatePending] = useActionState(updateSalesLead, initialState);
  const [noteState, noteAction, notePending] = useActionState(addSalesLeadNote, initialState);
  const [activityState, activityAction, activityPending] = useActionState(addSalesLeadActivity, initialState);
  const [stageState, stageAction, stagePending] = useActionState(changeLeadStage, initialState);
  const [completeState, completeAction, completePending] = useActionState(completeLeadReminder, initialState);
  const [enrollState, enrollAction, enrollPending] = useActionState(enrollFoundingCustomer, initialState);
  const [followupState, followupAction, followupPending] = useActionState(scheduleLeadFollowup, initialState);
  const [proposalState, proposalAction, proposalPending] = useActionState(createSalesProposal, initialState);
  const [onboardingState, onboardingAction, onboardingPending] = useActionState(startCustomerOnboarding, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveSalesLead, initialState);

  const openReminders = reminders.filter((reminder) => !reminder.completed_at);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="aurora-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2">
              <PipelineStageBadge stage={lead.pipeline_stage} />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{lead.contact_name}</h1>
            <p className="text-sm text-muted">{lead.contact_email}</p>
            <p className="mt-1 text-sm text-muted">
              {getLeadSourceLabel(lead.lead_source)} · {lead.company_name ?? "No company"}
            </p>
            {lead.location ? <p className="mt-1 text-sm text-muted">{lead.location}</p> : null}
          </div>
          {lead.is_founding_customer ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Founding customer</span>
          ) : null}
        </div>

        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.filter((stage) => stage.key !== lead.pipeline_stage).map((stage) => (
              <form key={stage.key} action={stageAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="pipelineStage" value={stage.key} />
                <button
                  type="submit"
                  disabled={stagePending}
                  className={cn(
                    "rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-muted hover:text-foreground",
                    focusRing,
                  )}
                >
                  → {stage.label}
                </button>
              </form>
            ))}
          </div>
        ) : null}
        {stageState.error ? <FormAlert variant="error" className="mt-3">{stageState.error}</FormAlert> : null}
        {stageState.success ? <FormAlert variant="success" className="mt-3">Stage updated.</FormAlert> : null}

        {canManage ? (
          <form action={updateAction} className="mt-6 space-y-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Pipeline stage</span>
                <select name="pipelineStage" defaultValue={lead.pipeline_stage} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage.key} value={stage.key}>{stage.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Owner</span>
                <select name="ownerUserId" defaultValue={lead.owner_user_id ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">MRR estimate</span>
                <input name="mrrEstimate" type="number" min={0} step="0.01" defaultValue={lead.mrr_estimate ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Deal value</span>
                <input name="leadValue" type="number" min={0} step="0.01" defaultValue={lead.lead_value ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Next follow-up</span>
                <input name="nextFollowupAt" type="datetime-local" defaultValue={lead.next_followup_at?.slice(0, 16) ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Company size</span>
                <input name="companySize" defaultValue={lead.company_size ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Website</span>
                <input name="website" defaultValue={lead.website ?? ""} autoComplete="url" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-foreground">Industry</span>
                <input name="industry" defaultValue={lead.industry ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">LinkedIn</span>
                <input name="linkedinUrl" defaultValue={lead.linkedin_url ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Location</span>
                <input name="location" defaultValue={lead.location ?? ""} autoComplete="address-level2" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Employees</span>
                <input name="employeeCount" type="number" min={0} defaultValue={lead.employee_count ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Segment</span>
                <select name="prospectSegment" defaultValue={lead.prospect_segment ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {OUTBOUND_LIST_TYPES.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Region</span>
                <select name="sourceRegion" defaultValue={lead.source_region ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {LEAD_SOURCE_REGIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Agency type</span>
                <select name="agencyType" defaultValue={lead.agency_type ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {AGENCY_TYPES.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-foreground">Pain points</span>
                <textarea name="painPoints" rows={3} defaultValue={lead.pain_points ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-foreground">Notes</span>
                <textarea name="notes" rows={4} defaultValue={lead.notes ?? lead.message ?? ""} className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
              </label>
            </div>
            {updateState.error ? <FormAlert variant="error">{updateState.error}</FormAlert> : null}
            {updateState.success ? <FormAlert variant="success">Lead updated.</FormAlert> : null}
            <Button type="submit" disabled={updatePending}>{updatePending ? "Saving…" : "Save lead"}</Button>
          </form>
        ) : (
          <div className="mt-6 space-y-3 text-sm text-muted">
            <p><strong className="text-foreground">Stage:</strong> <PipelineStageBadge stage={lead.pipeline_stage} /></p>
            <p><strong className="text-foreground">Owner:</strong> {lead.ownerName ?? "Unassigned"}</p>
            <p><strong className="text-foreground">MRR estimate:</strong> {lead.mrr_estimate ?? "—"}</p>
            <p><strong className="text-foreground">Deal value:</strong> {lead.lead_value ?? "—"}</p>
            <p><strong className="text-foreground">Priority score:</strong> {lead.priority_score ?? "—"}</p>
            <p><strong className="text-foreground">Notes:</strong> {lead.notes ?? lead.message ?? "—"}</p>
          </div>
        )}
      </section>

      <aside className="space-y-6">
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Follow-up tasks</h2>
          {openReminders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No open follow-ups.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openReminders.map((reminder) => (
                <li key={reminder.id} className="rounded-xl border border-border-subtle px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{reminder.subject}</p>
                  <p className="text-xs text-muted">Due {formatDateTime(reminder.due_at)}</p>
                  {canManage ? (
                    <form action={completeAction} className="mt-2">
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <input type="hidden" name="leadId" value={lead.id} />
                      <Button type="submit" size="sm" variant="outline" disabled={completePending}>
                        Mark complete
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {completeState.success ? <FormAlert variant="success" className="mt-3">Follow-up completed.</FormAlert> : null}
        </section>

        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Enrichment scores</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">Pain</dt><dd className="font-semibold text-foreground">{lead.pain_score ?? "—"}</dd></div>
            <div><dt className="text-muted">Fit</dt><dd className="font-semibold text-foreground">{lead.fit_score ?? "—"}</dd></div>
            <div><dt className="text-muted">Priority</dt><dd className="font-semibold text-foreground">{lead.priority_score ?? "—"}</dd></div>
            <div><dt className="text-muted">Potential MRR</dt><dd className="font-semibold text-foreground">{lead.potential_mrr ?? "—"}</dd></div>
            <div><dt className="text-muted">ARR est.</dt><dd className="font-semibold text-foreground">{lead.arr_estimate ?? "—"}</dd></div>
            <div><dt className="text-muted">Segment</dt><dd className="font-semibold text-foreground">{lead.prospect_segment ?? "—"}</dd></div>
          </dl>
          {canManage ? (
            <form action={followupAction} className="mt-4">
              <input type="hidden" name="leadId" value={lead.id} />
              {followupState.error ? <FormAlert variant="error">{followupState.error}</FormAlert> : null}
              {followupState.success ? <FormAlert variant="success">Follow-up scheduled.</FormAlert> : null}
              <Button type="submit" size="sm" variant="secondary" disabled={followupPending} className="mt-2 w-full">
                {followupPending ? "Scheduling…" : "Schedule cadence follow-up"}
              </Button>
            </form>
          ) : null}
        </section>

        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Activity timeline</h2>
          {activities.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="rounded-xl border border-border-subtle px-3 py-2 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{activity.activity_type}</p>
                  <p className="font-medium text-foreground">{activity.subject ?? activity.activity_type}</p>
                  {activity.body ? <p className="mt-1 text-muted">{activity.body}</p> : null}
                  <p className="mt-1 text-xs text-muted">{formatDateTime(activity.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
          <>
            <section className="aurora-surface p-5">
              <h2 className="text-base font-semibold text-foreground">Log activity</h2>
              <form action={activityAction} className="mt-4 space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Activity type</span>
                  <select name="activityType" defaultValue="call" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm">
                    {SALES_ACTIVITY_TYPES.filter((type) => type.key !== "note").map((type) => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Subject</span>
                  <input required name="subject" placeholder="Subject" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Details (optional)</span>
                  <textarea name="body" rows={2} placeholder="Details (optional)" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Follow-up due (optional)</span>
                  <input name="dueAt" type="datetime-local" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
                </label>
                {activityState.error ? <FormAlert variant="error">{activityState.error}</FormAlert> : null}
                {activityState.success ? <FormAlert variant="success">Activity logged.</FormAlert> : null}
                <Button type="submit" size="sm" disabled={activityPending}>
                  {activityPending ? "Saving…" : "Log activity"}
                </Button>
              </form>
            </section>

            <section className="aurora-surface p-5">
              <h2 className="text-base font-semibold text-foreground">Add note</h2>
              <form action={noteAction} className="mt-4 space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Subject</span>
                  <input required name="subject" placeholder="Subject" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Note</span>
                  <textarea required name="body" rows={3} placeholder="Note" className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm" />
                </label>
                {noteState.error ? <FormAlert variant="error">{noteState.error}</FormAlert> : null}
                {noteState.success ? <FormAlert variant="success">Note added.</FormAlert> : null}
                <button type="submit" disabled={notePending} className={cn("rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", focusRing)}>
                  {notePending ? "Adding…" : "Add note"}
                </button>
              </form>
            </section>

            {!lead.is_founding_customer ? (
              <form action={enrollAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                {enrollState.error ? <FormAlert variant="error">{enrollState.error}</FormAlert> : null}
                {enrollState.success ? <FormAlert variant="success">Enrolled in founding program.</FormAlert> : null}
                <Button type="submit" disabled={enrollPending} className="w-full">
                  {enrollPending ? "Enrolling…" : "Enroll as founding customer"}
                </Button>
              </form>
            ) : null}
            <form action={proposalAction} className="mt-3">
              <input type="hidden" name="leadId" value={lead.id} />
              {proposalState.error ? <FormAlert variant="error">{proposalState.error}</FormAlert> : null}
              {proposalState.success ? <FormAlert variant="success">Proposal created.</FormAlert> : null}
              <Button type="submit" size="sm" variant="secondary" disabled={proposalPending} className="w-full">
                {proposalPending ? "Generating…" : "Generate proposal"}
              </Button>
            </form>
            <form action={onboardingAction} className="mt-3">
              <input type="hidden" name="leadId" value={lead.id} />
              {onboardingState.error ? <FormAlert variant="error">{onboardingState.error}</FormAlert> : null}
              {onboardingState.success ? <FormAlert variant="success">Onboarding started.</FormAlert> : null}
              <Button type="submit" size="sm" variant="outline" disabled={onboardingPending} className="w-full">
                {onboardingPending ? "Starting…" : "Start customer onboarding"}
              </Button>
            </form>
            <form action={archiveAction} className="mt-3">
              <input type="hidden" name="leadId" value={lead.id} />
              {archiveState.error ? <FormAlert variant="error">{archiveState.error}</FormAlert> : null}
              {archiveState.success ? <FormAlert variant="success">Lead archived.</FormAlert> : null}
              <Button type="submit" size="sm" variant="outline" disabled={archivePending} className="w-full text-muted">
                {archivePending ? "Archiving…" : "Archive lead (Lost)"}
              </Button>
            </form>
          </>
        ) : null}
      </aside>
    </div>
  );
}
