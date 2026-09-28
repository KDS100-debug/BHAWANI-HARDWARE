# Bhawani Hardware

Production-oriented inventory, commerce, billing, GST and accounting PWA built with Next.js and Supabase PostgreSQL.

## Current architecture

- Next.js App Router and strict TypeScript
- Supabase Auth, PostgreSQL, Storage and Row Level Security
- Database/RPC-authoritative money, stock and transaction workflows
- Decimal-safe TypeScript utilities for display and pre-validation only
- Customer PWA with safe read caching; financial writes always require the server

## Hosted app

The production site is [bhawani-hardware.vercel.app](https://bhawani-hardware.vercel.app). The GitHub `main` branch is connected to the Vercel project; pushes to `main` trigger production deployments. Configure production environment variables in Vercel rather than committing `.env.production`; use `.env.example` only as the variable-name template. Keep elevated Supabase keys out of Git and browser variables.

## Development setup

1. Install Node.js 22+, Docker Desktop, and the Supabase CLI dependencies.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values printed by `npm run db:start`.
4. Run `npm run db:reset` to apply migrations and seed development data.
5. Run `npm run dev`.

The development seed is in [supabase/seed.sql](supabase/seed.sql). It creates clearly labeled test catalogue data only; it does not create production inventory or an administrator.

## Admin bootstrap

Customer accounts can register at `/login`. Create the first staff account in the Supabase Dashboard under Authentication using a unique development-only email and a password stored in your password manager. Then assign its profile role through a trusted SQL editor action, for example `update public.profiles set role = 'owner' where id = '<auth-user-id>';`. Never commit those credentials. The `/admin` route verifies the profile role server-side.

## Owner and staff permissions

Apply migrations `202609270001_add_staff_role.sql` and `202609270002_rbac.sql` to enable the role system. The application uses three enforcement layers:

- Supabase Auth establishes the user identity and session.
- Server Components and every Server Action verify the effective permission before reading or mutating protected data.
- PostgreSQL RLS, security-definer permission helpers, field-sensitive triggers and column grants reject unauthorized direct API calls.

`owner` is an unconditional application override. `staff` starts with only operational order, sale, product, inventory, customer and supplier permissions. Optional access is stored as per-user overrides and can be managed at `/admin/staff`. Sensitive dashboards, purchase cost, profitability, settings, staff administration and audit history are absent from the default Staff interface.

To create staff from the application, create a dedicated Supabase secret key and add it as `SUPABASE_SECRET_KEY` to the trusted server environment in Vercel. For local development, put the rotated key in the ignored `.env.local` file. It must never use a `NEXT_PUBLIC_` prefix. The key is used only by the server-side staff-creation action; browser sessions continue to use the publishable key and RLS. If this secret is not configured, owners can still create a user in the Supabase Dashboard and assign `role = 'staff'` in the SQL Editor.

Audit rows are append-only for browser roles. Confirmed financial and inventory workflows should use future cancellation, reversal, return and correction records rather than hard deletes.

## WhatsApp customer sign-in

Customer phone OTP is implemented but disabled by default so existing email sign-in remains available until delivery is ready. Enable Phone Auth in the hosted Supabase Dashboard, configure **Twilio or Twilio Verify** and an approved WhatsApp sender, then set `NEXT_PUBLIC_WHATSAPP_OTP_ENABLED=true` in Vercel's Production environment and redeploy. Do not put Twilio credentials in Git or `NEXT_PUBLIC_` variables. Customer sign-up/sign-in then uses a WhatsApp code instead of email verification; staff email/password sign-in remains unchanged. Plan how existing email-only customer accounts will link their phone numbers before enabling this for everyone. Set Supabase Auth rate limits and CAPTCHA before broad rollout.

## Production setup

Apply `supabase/migrations` in order to the hosted Supabase project before using staff sign-in. Run each migration separately so the new `staff` enum value is committed before the RBAC migration references it. In the hosted Supabase Dashboard, set the Auth Site URL to `https://bhawani-hardware.vercel.app` and allow `https://bhawani-hardware.vercel.app/**` as a redirect URL. The local `supabase/config.toml` does not change hosted Auth settings. Create the first owner through a trusted server or Supabase Dashboard, and keep the server secret out of the repo and all browser variables.

## Verification

Run `npm run check` and `npm run build`. Database tests are documented alongside migrations as they are added.

See [docs/production-checklist.md](docs/production-checklist.md) for the remaining release gate.

## Status

The foundation, public catalogue and owner/staff authorization system are implemented. Order, sales, purchase, inventory, accounting and reporting transaction ledgers remain phased work; their protected module entry points are present, but the UI labels them as unconnected rather than displaying fabricated business data. The current audit and remaining work are tracked in [docs/gap-analysis.md](docs/gap-analysis.md); the full business system is not yet production-complete.
