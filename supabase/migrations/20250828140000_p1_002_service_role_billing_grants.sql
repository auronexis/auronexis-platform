-- P1-002: service_role table grants for billing / invoice issuance.
-- Forward-only remediation for missing table grants in
-- 20250824100000_p1_002_pricing_tax_invoice_contracting.sql.
-- Least-privilege: only privileges proven required by createAdminClient() billing paths.

-- sales_invoices: INSERT (issueSalesInvoice), SELECT (lookups, idempotency, PDF, email, history)
GRANT SELECT, INSERT ON TABLE public.sales_invoices TO service_role;

-- organization_billing_identities: SELECT + UPSERT (INSERT/UPDATE) for checkout/billing profile
GRANT SELECT, INSERT, UPDATE ON TABLE public.organization_billing_identities TO service_role;

-- organization_contract_acceptances: append-only INSERT + SELECT for contract evidence
GRANT SELECT, INSERT ON TABLE public.organization_contract_acceptances TO service_role;

-- sales_invoice_number_counters: intentionally NOT granted.
-- Counter access is encapsulated by allocate_sales_invoice_number() SECURITY DEFINER;
-- service_role already has EXECUTE on that function from 20250824100000.
