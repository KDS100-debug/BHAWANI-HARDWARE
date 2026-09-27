-- Keep this enum change in its own migration. PostgreSQL requires the new
-- value to be committed before it is referenced by later migrations.
alter type public.app_role add value if not exists 'staff';
