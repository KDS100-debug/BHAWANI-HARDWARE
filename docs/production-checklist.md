# Production readiness checklist

- [ ] Link a dedicated Supabase production project and apply reviewed migrations.
- [ ] Generate database types from the deployed schema.
- [ ] Create the first owner through a controlled bootstrap procedure; remove development accounts.
- [ ] Confirm RLS with anon, each staff role and service-role test cases.
- [ ] Configure Auth URL allowlists, SMTP, password policy and MFA expectations.
- [ ] Keep service-role credentials only in explicitly trusted server environments.
- [ ] Configure private Storage buckets, MIME/size checks and signed URL expiry.
- [ ] Validate numbering, concurrency, idempotency and backup restore in staging.
- [ ] Review current Indian GST invoice and reporting requirements with a qualified professional.
- [ ] Configure Supabase backups/PITR for the selected plan and perform a restore drill.
- [ ] Set security headers, monitoring, rate limits and alerting at the deployment edge.
- [ ] Run `npm run check`, `npm run build`, database tests and browser smoke tests.
- [ ] Test installability, offline fallback, mobile checkout and A4 print output on target devices.
