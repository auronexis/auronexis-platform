import type { EInvoiceViewerParty } from "@/lib/einvoice-viewer/types";

type PartyCardProps = {
  title: string;
  party: EInvoiceViewerParty;
};

function Line({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return <p className="text-sm text-foreground">{children}</p>;
}

export function PartyCard({ title, party }: PartyCardProps) {
  const cityLine = [party.postalCode, party.city].filter(Boolean).join(" ");
  return (
    <section className="min-w-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </h2>
      <div className="mt-3 space-y-0.5">
        <p className="text-base font-semibold text-foreground">{party.name ?? "—"}</p>
        <Line>{party.street}</Line>
        <Line>{party.street2}</Line>
        <Line>{cityLine || null}</Line>
        <Line>{party.countryCode}</Line>
        {party.vatId ? (
          <p className="pt-2 text-sm text-foreground">
            <span className="text-muted">USt-IdNr.: </span>
            {party.vatId}
          </p>
        ) : null}
        {party.email ? (
          <p className="text-sm text-foreground">
            <span className="text-muted">E-Mail: </span>
            {party.email}
          </p>
        ) : null}
      </div>
    </section>
  );
}
