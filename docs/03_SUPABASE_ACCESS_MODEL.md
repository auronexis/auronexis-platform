# Supabase access model (Build Bible V2 Chapter 1)

Auroranexis uses a **two-layer** access model for all tenant data.

## Layer 1 — Row Level Security (RLS)

- Every tenant-scoped table must have `ENABLE ROW LEVEL SECURITY`.
- Policies must scope reads/writes to the caller's organization (typically via `current_organization_id()` / related helpers).
- New tables: ship `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`, and `CREATE POLICY` in the **same** migration.
- Never weaken tenant isolation for convenience.

## Layer 2 — RBAC (application)

- Server Actions and route guards enforce role permissions (`owner` / `admin` / `staff` / `viewer`).
- RLS is necessary but not sufficient for privileged mutations.
- Do not widen or shrink roles accidentally when adding features.

## Secrets

- Never expose service-role keys, Paddle secrets, or webhook secrets to Client Components or public env vars.
