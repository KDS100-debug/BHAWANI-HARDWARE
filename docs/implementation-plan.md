# Implementation plan

This repository began empty on 2026-09-25. Work proceeds in dependency order so UI never gets ahead of data integrity.

1. Foundation: Next.js, strict TypeScript, Supabase clients, PWA shell, tests and environment validation.
2. Authorization: Auth session refresh, profiles, roles, permissions, RLS and protected admin routes.
3. Catalogue: categories, products, public reads, Storage policies, search and admin CRUD.
4. Customer commerce: persistent cart, server-authoritative COD checkout, order numbers and confirmation.
5. Inventory: append-only movements, balances, reservations, adjustments and low-stock views.
6. Order management: validated transitions, history, reservation confirmation/release and admin tooling.
7. Sales: direct sales and idempotent delivery-to-sale finalization with COGS, payment and invoice.
8. Purchases: supplier purchases, inventory receipt and weighted-average cost updates.
9. Accounting: parties, payments, ledgers, expenses and explainable balances.
10. Profit: captured COGS, gross/net profit and reporting views.
11. Billing: historical snapshots and print-ready normal invoices.
12. GST: configurable tax rates/rules, GST sales/purchases, tax invoices and reports.
13. Returns: sale/purchase returns and credit/debit note foundations.
14. Reporting: dashboard, filters and authorized CSV/PDF outputs.
15. Hardening: audit coverage, concurrency/idempotency tests, mobile/PWA/print checks and recovery runbooks.

Every phase is checked with TypeScript, ESLint, tests, build, SQL constraints/RLS review and a Git commit. GitHub pushes require a configured remote.
