# GoalTrack Portal

A full-stack Employee Goal Setting and Tracking Portal with 3 user roles: Employee, Manager, and Admin.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/goal-portal run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@test.com | Test@123 |
| Manager | manager@test.com | Test@123 |
| Admin | admin@test.com | Test@123 |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- API: Express 5 with session-based auth (express-session + connect-pg-simple)
- DB: PostgreSQL + Drizzle ORM
- Auth: bcryptjs password hashing, server-side sessions
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — Drizzle table definitions (users, goals, checkins)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, goals, checkins, users, dashboard, reports)
- `artifacts/api-server/src/lib/auth.ts` — requireAuth + requireRole middleware
- `artifacts/goal-portal/src/pages/` — React pages organized by role (auth/, employee/, manager/, admin/)
- `artifacts/goal-portal/src/components/` — Shared components (layout, shared/status-badge, ui/)

## Architecture decisions

- Session-based auth (not JWT): simpler for same-origin web apps, sessions stored in PostgreSQL via connect-pg-simple
- Role-based access enforced on both backend (requireRole middleware) and frontend (ProtectedRoute + redirect logic)
- Drizzle ORM with PostgreSQL — not SQLite — because Replit provisions PostgreSQL natively with rollback support
- OpenAPI-first: all endpoints defined in openapi.yaml, client hooks and Zod schemas are fully generated (no manual types)
- The `enrichGoals()` helper in goals.ts joins user data on every goal query to avoid N+1 and keep routes thin

## Product

- **Employee**: Create up to 8 goals (min 10% weightage each, total must equal 100%), update quarterly achievements (Q1-Q4), submit for manager approval, view status badges
- **Manager**: Approve or reject employee goals with comments, add check-in comments, view team dashboard with per-employee stats
- **Admin**: Manage all users (CRUD with role/manager assignment), view all goals, unlock approved/locked goals for re-editing, export reports as JSON

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before typechecking the API server — the lib needs to emit updated declarations first
- After every `openapi.yaml` change, run codegen before using updated hook/schema names
- Session cookie is `httpOnly`, `sameSite: lax` — no CSRF issues for standard use

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
