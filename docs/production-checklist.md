# Production readiness checklist

- [ ] Link a dedicated Supabase production project and apply reviewed migrations.
- [ ] Generate database types from the deployed schema.
- [ ] Create the first owner through a controlled bootstrap procedure; remove development accounts.
- [ ] Confirm RLS with anon, each staff role and service-role test cases.
- [ ] Apply `202609270001_add_staff_role.sql` and `202609270002_rbac.sql` separately and verify `my_permissions()` for an owner and a default staff account.
- [ ] Add `SUPABASE_SECRET_KEY` to Vercel Production only if in-app staff creation is required; confirm it is absent from client bundles and `NEXT_PUBLIC_*` variables.
- [ ] Verify default Staff cannot select `products.default_purchase_cost`, open profit/settings/audit routes, or invoke permission-protected writes directly.
- [ ] Verify staff activation and permission changes produce immutable `audit_logs` rows.
- [ ] Configure Auth URL allowlists, SMTP, password policy and MFA expectations.
- [ ] Keep service-role credentials only in explicitly trusted server environments.
- [ ] Configure private Storage buckets, MIME/size checks and signed URL expiry.
- [ ] Validate numbering, concurrency, idempotency and backup restore in staging.
- [ ] Review current Indian GST invoice and reporting requirements with a qualified professional.
- [ ] Configure Supabase backups/PITR for the selected plan and perform a restore drill.
- [ ] Set security headers, monitoring, rate limits and alerting at the deployment edge.
- [ ] Run `npm run check`, `npm run build`, database tests and browser smoke tests.
- [ ] Test installability, offline fallback, mobile checkout and A4 print output on target devices.
