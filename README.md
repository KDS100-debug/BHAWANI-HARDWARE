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

Never expose `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or browser bundle.

## Verification

Run `npm run check` and `npm run build`. Database tests are documented alongside migrations as they are added.

## Deployment

Create a Supabase project, apply `supabase/migrations` in order, configure Auth redirect URLs and Storage policies, generate fresh database types, then deploy the Next.js app with the public Supabase URL and publishable key. See `docs/production-checklist.md` for the release gate.

## Status

The repository was initialized from an empty directory. See `docs/implementation-plan.md` for the phased build plan and completion criteria.
