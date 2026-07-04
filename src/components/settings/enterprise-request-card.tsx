"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { createEnterpriseRequestAction } from "@/lib/enterprise/actions";
import type { EnterpriseRequestView, EnterpriseStatus } from "@/lib/enterprise/types";
import { ENTERPRISE_BILLING_CONTACT_PATH } from "@/lib/billing/billing-contact";
import { formatBillingDateTime } from "@/lib/billing/types";

type EnterpriseRequestCardProps = {
  status: EnterpriseStatus;
  canManage: boolean;
  autoOpen?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Submitted",
  contacted: "Contacted",
  qualified: "Qualified",
  approved: "Approved",
  rejected: "Not approved",
  closed: "Closed",
};

export function EnterpriseRequestCard({ status, canManage, autoOpen = false }: EnterpriseRequestCardProps) {
  const [request, setRequest] = useState<EnterpriseRequestView | null>(status.latestRequest);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(autoOpen);
  const [isPending, startTransition] = useTransition();

  if (status.hasActiveOverride) {
    return (
      <PageSurface>
        <PageSurfaceHeading title="Enterprise active" />
        <p className="mt-4 text-sm text-muted">
          Your workspace has an active Enterprise plan override with custom limits and capabilities.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-foreground sm:grid-cols-2">
          {status.apiEnabled ? <li>Public API enabled</li> : null}
          {status.webhooksEnabled ? <li>Outbound webhooks enabled</li> : null}
          {status.aiEnabled ? <li>AI modules enabled</li> : null}
          {status.prioritySupportEnabled ? <li>Priority support</li> : null}
          {status.portalBrandingEnabled ? <li>Portal branding enabled</li> : null}
          {status.customDomainEnabled ? <li>Custom domain enabled</li> : null}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Manage API keys on{" "}
          <Link href="/settings/api" className="font-medium text-primary hover:underline">
            Public API settings
          </Link>
          .
        </p>
      </PageSurface>
    );
  }

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createEnterpriseRequestAction({
        contactEmail: String(formData.get("contactEmail") ?? ""),
        companyName: String(formData.get("companyName") ?? ""),
        requestedSeats: formData.get("requestedSeats")
          ? Number(formData.get("requestedSeats"))
          : null,
        requestedClients: formData.get("requestedClients")
          ? Number(formData.get("requestedClients"))
          : null,
        notes: String(formData.get("notes") ?? "") || null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setRequest(result.data);
      setShowForm(false);
      setSuccess("Enterprise request submitted. Our team will contact you to finalize onboarding.");
    });
  };

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Enterprise plan"
        description="Enterprise onboarding is handled manually with custom seats, limits, API access, and support."
      />

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}

      {request ? (
        <div className="mt-4 rounded-xl border border-border/70 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            Request status: {STATUS_LABELS[request.status] ?? request.status}
          </p>
          <p className="mt-1 text-muted">
            Submitted {formatBillingDateTime(request.createdAt) ?? "recently"}
            {request.contactEmail ? ` · ${request.contactEmail}` : ""}
          </p>
          {request.notes ? <p className="mt-2 text-muted">{request.notes}</p> : null}
        </div>
      ) : null}

      {canManage && showForm ? (
        <form action={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Input name="contactEmail" label="Contact email" type="email" placeholder="you@company.com" />
          <Input name="companyName" label="Company name" placeholder="Your agency name" />
          <Input name="requestedSeats" label="Requested seats" type="number" min={1} placeholder="10" />
          <Input name="requestedClients" label="Requested clients" type="number" min={1} placeholder="100" />
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="enterprise-notes">
              Notes
            </label>
            <textarea
              id="enterprise-notes"
              name="notes"
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Tell us about your onboarding needs, integrations, or compliance requirements."
            />
          </div>
          <Button type="submit" loading={isPending}>
            Submit Enterprise request
          </Button>
        </form>
      ) : null}

      {canManage && !showForm ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={() => setShowForm(true)} disabled={isPending}>
            {request ? "Submit another request" : "Request Enterprise"}
          </Button>
          <Link
            href={ENTERPRISE_BILLING_CONTACT_PATH}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            View Enterprise details
          </Link>
        </div>
      ) : null}

      {!canManage ? (
        <p className="mt-4 text-sm text-muted">
          Contact your organization owner or admin to request Enterprise access.
        </p>
      ) : null}
    </PageSurface>
  );
}
