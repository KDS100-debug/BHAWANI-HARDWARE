# Bhawani Hardware

Production-oriented inventory, commerce, billing, GST and accounting PWA built with Next.js and Supabase PostgreSQL.

## Current architecture

- Next.js App Router and strict TypeScript
- Supabase Auth, PostgreSQL, Storage and Row Level Security
- Database/RPC-authoritative money, stock and transaction workflows
- Decimal-safe TypeScript utilities for display and pre-validation only
- Customer PWA with safe read caching; financial writes always require the server

## Hosted app

The production site is [bhawani-hardware.vercel.app](https://bhawani-hardware.vercel.app). The GitHub `main` branch is connected to the Vercel project; pushes to `main` trigger production deployments. Public Supabase settings and the canonical site URL are in `.env.production`. Keep elevated Supabase keys out of Git and browser variables.

## Development setup

1. Install Node.js 22+, Docker Desktop, and the Supabase CLI dependencies.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values printed by `npm run db:start`.
4. Run `npm run db:reset` to apply migrations and seed development data.
5. Run `npm run dev`.

The development seed is in [supabase/seed.sql](supabase/seed.sql). It creates clearly labeled test catalogue data only; it does not create production inventory or an administrator.

## Admin bootstrap

Customer accounts can register at `/login`. Create the first staff account in the Supabase Dashboard under Authentication using a unique development-only email and a password stored in your password manager. Then assign its profile role through a trusted SQL editor action, for example `update public.profiles set role = 'owner' where id = '<auth-user-id>';`. Never commit those credentials. The `/admin` route verifies the profile role server-side.

## Production setup

Apply `supabase/migrations` in order to the hosted Supabase project before using staff sign-in. In the hosted Supabase Dashboard, set the Auth Site URL to `https://bhawani-hardware.vercel.app` and allow `https://bhawani-hardware.vercel.app/**` as a redirect URL. The local `supabase/config.toml` does not change hosted Auth settings. Create the first owner through a trusted server or Supabase Dashboard, and keep the service-role key out of the repo and Vercel browser variables.

## Verification

Run `npm run check` and `npm run build`. Database tests are documented alongside migrations as they are added.

See [docs/production-checklist.md](docs/production-checklist.md) for the remaining release gate.

## Status

The foundation and first public catalogue slice are implemented. The current audit and remaining phased work are tracked in [docs/gap-analysis.md](docs/gap-analysis.md); the full business system is not yet production-complete.
