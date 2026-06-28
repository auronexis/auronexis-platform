# Auroranexis

The Operations Command Center for AI Automation Agencies.

**Monitor clients. Detect risks. Prove value.**

## Foundation Build v1

Production-grade foundation architecture:

- Next.js 15 App Router + TypeScript + Tailwind CSS
- Supabase Auth + PostgreSQL multi-tenancy
- RBAC (Owner, Admin, Staff, Viewer)
- Dashboard shell with primary navigation
- Organization bootstrap on signup

Business modules (clients, incidents, health score, reports, etc.) are **not** implemented in this phase.

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase](https://supabase.com) project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Apply the database migration in your Supabase project:

   - Run `supabase/migrations/20250623000000_foundation.sql` via the Supabase SQL editor, or
   - Use the Supabase CLI: `supabase db push`

   **Important:** Use the **Secret** key (`sb_secret_...`) or legacy **service_role** JWT from
   Supabase Dashboard → Settings → API Keys for `SUPABASE_SERVICE_ROLE_KEY`.

4. Configure Supabase Auth redirect URL:

   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and create an agency account.

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (dashboard)/     # Protected app shell + module routes
│   └── auth/callback/   # Supabase auth callback
├── components/
│   ├── auth/            # Auth forms
│   ├── layout/          # Dashboard shell, navigation
│   └── ui/              # Shared UI primitives
├── lib/
│   ├── auth/            # Session, sign-in/out actions
│   ├── rbac/            # Permission matrix + guards
│   ├── supabase/        # Client, server, admin, middleware
│   └── tenancy/         # Org context, navigation config
└── types/
    └── database.ts      # Supabase types (foundation tables)
supabase/
└── migrations/          # PostgreSQL schema + RLS
docs/                    # Product & architecture documentation
```

## Security model

| Layer | Responsibility |
|-------|----------------|
| PostgreSQL RLS | Organization isolation |
| Server Actions | Role-based authorization |
| Middleware | Session refresh + route protection |

See `docs/07_RBAC_BLUEPRINT_V1.md` and `docs/10_ARCHITECTURE_RECONCILIATION_V1.md`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Documentation

All development decisions follow `docs/00` through `docs/10`.
