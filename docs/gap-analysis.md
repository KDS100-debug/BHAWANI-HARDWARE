# Gap analysis

Audited on 2026-09-25 against the master build specification.

## Implemented

- Next.js 16 App Router foundation with strict TypeScript and security headers.
- Supabase browser/server session clients using the publishable key only.
- PWA manifest, service-worker registration, static caching and offline fallback.
- Decimal-safe money helpers with unit tests.
- Catalogue migration for categories and products, including constraints, indexes, timestamps and public read RLS policies.
- Public server-rendered catalogue routes: `/categories` and `/category/[slug]`.
- Environment placeholder conventions with ignored local secret files.

## Partially implemented

- Supabase Auth session refresh, business profiles, owner/staff permissions, RLS enforcement and protected admin routes are implemented. The hosted project still requires the latest RBAC migrations before Staff access is enabled.
- Permission-filtered owner/staff shells and module entry points exist, but customer cart/checkout and business transaction workflows are not connected.
- Database type generation is represented for the current catalogue tables; it must be regenerated from the deployed schema after migration application.
- Storage is configured at the local Supabase level, but product-image buckets and upload policies are not implemented.

## Missing

- Orders, COD checkout, order numbering and status history.
- Reservations, inventory ledger, stock adjustments and concurrency-safe availability.
- Direct sales, purchases, weighted-average costing, COGS and idempotent finalization.
- Customers, retailers, suppliers, payments, ledgers, expenses and profit reporting.
- GST tax engine, GST transactions, invoices, returns and credit/debit notes.
- Business-transaction audit coverage, admin CRUD for each ledger, live dashboard metrics, reports, exports and integration/concurrency/security tests.

## Needs refactoring later

- Replace disabled catalogue actions with a persistent cart and server-authoritative checkout.
- Split reusable customer/admin layouts from the current minimal public shell.
- Replace manually maintained database types with `npm run db:types` after the Supabase project is linked.
- Add database migration tests and browser smoke tests before production deployment.

## Next implementation order

1. Catalogue administration and private Storage policies.
2. Order, sales and payment ledgers with permission-gated transition RPCs.
3. COD cart, checkout, order numbering and order persistence.
4. Inventory ledger and reservation RPCs, followed by order operations.
5. Sales, purchases, payments, ledgers, GST and reporting in transactional slices.
