# Bhawani Hardware

Production-oriented inventory, commerce, billing, GST and accounting PWA built with Next.js and Supabase PostgreSQL.

## Current architecture

- Next.js App Router and strict TypeScript
- Supabase Auth, PostgreSQL, Storage and Row Level Security
- Database/RPC-authoritative money, stock and transaction workflows
- Decimal-safe TypeScript utilities for display and pre-validation only
- Customer PWA with safe read caching; financial writes always require the server

## Local setup

1. Install Node.js 22+, Docker Desktop, and the Supabase CLI dependencies.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values printed by `npm run db:start`.
4. Run `npm run db:reset` to apply migrations and seed development data.
5. Run `npm run dev`.

The development seed is in [supabase/seed.sql](supabase/seed.sql). It creates clearly labeled test catalogue data only; it does not create production inventory or an administrator.

## Admin bootstrap

Customer accounts can register at `/login`. Create the first staff account in the Supabase Dashboard under Authentication using a unique development-only email and a password stored in your password manager. Then assign its profile role through a trusted SQL editor action, for example `update public.profiles set role = 'owner' where id = '<auth-user-id>';`. Never commit those credentials. The `/admin` route verifies the profile role server-side.

## Deployment

Deploy the Next.js app through a provider such as Vercel after applying the migrations to the target Supabase project. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, and the server-only variables from `.env.example` in the provider. A rotated `SUPABASE_SECRET_KEY` must remain server-only. The current workspace has no deployment-provider login or server secret, so no remote deployment or Auth user was created from this session.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or browser bundle.

## Verification

Run `npm run check` and `npm run build`. Database tests are documented alongside migrations as they are added.

## Deployment

Create a Supabase project, apply `supabase/migrations` in order, configure Auth redirect URLs and Storage policies, generate fresh database types, then deploy the Next.js app with the public Supabase URL and publishable key. See `docs/production-checklist.md` for the release gate.

## Status

The foundation and first public catalogue slice are implemented. The current audit and remaining phased work are tracked in [docs/gap-analysis.md](docs/gap-analysis.md); the full business system is not yet production-complete.
