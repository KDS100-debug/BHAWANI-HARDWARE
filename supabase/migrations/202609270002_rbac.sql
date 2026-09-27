alter table public.profiles
add column if not exists email text;

update public.profiles as profile
set email = lower(auth_user.email)
from auth.users as auth_user
where auth_user.id = profile.id
  and profile.email is distinct from lower(auth_user.email);

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

create table public.permissions (
  code text primary key check (code ~ '^[a-z]+(?:\.[a-z_]+)+$'),
  module text not null check (module ~ '^[a-z]+$'),
  label text not null check (length(trim(label)) between 1 and 120),
  description text not null check (length(trim(description)) between 1 and 300),
  is_sensitive boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.role_permissions (
  role public.app_role not null,
  permission_code text not null references public.permissions(code) on delete cascade,
  granted boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role, permission_code)
);

create table public.user_permission_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  granted boolean not null,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, permission_code)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(trim(action)) between 3 and 120),
  entity_type text not null check (length(trim(entity_type)) between 1 and 80),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create trigger user_permission_overrides_set_updated_at
before update on public.user_permission_overrides
for each row execute function public.set_updated_at();

insert into public.permissions (code, module, label, description, is_sensitive)
values
  ('dashboard.view', 'dashboard', 'Operational dashboard', 'View day-to-day operational dashboard information.', false),
  ('dashboard.financial', 'dashboard', 'Financial dashboard', 'View business-wide financial and profitability metrics.', true),
  ('order.view', 'orders', 'View orders', 'Search and view customer orders and delivery information.', false),
  ('order.confirm', 'orders', 'Confirm orders', 'Confirm new customer orders.', false),
  ('order.prepare', 'orders', 'Prepare orders', 'Move confirmed orders into preparation.', false),
  ('order.dispatch', 'orders', 'Dispatch orders', 'Mark orders out for delivery.', false),
  ('order.deliver', 'orders', 'Deliver orders', 'Mark dispatched orders delivered.', false),
  ('order.cancel', 'orders', 'Cancel orders', 'Cancel eligible orders through the controlled workflow.', true),
  ('sale.view', 'sales', 'View sales', 'View and search sales and invoices.', false),
  ('sale.create', 'sales', 'Create sales', 'Create draft sales and add line items.', false),
  ('sale.confirm', 'sales', 'Confirm sales', 'Confirm a draft sale and issue its invoice.', false),
  ('sale.return', 'sales', 'Process sales returns', 'Create a controlled return against a confirmed sale.', true),
  ('sale.reverse', 'sales', 'Reverse sales', 'Reverse eligible confirmed sales without deleting history.', true),
  ('product.view', 'products', 'View products', 'View product identity, selling rate and availability.', false),
  ('product.create', 'products', 'Create products', 'Add products to the catalogue.', false),
  ('product.edit', 'products', 'Edit products', 'Edit non-sensitive product details.', false),
  ('product.change_price', 'products', 'Change selling rates', 'Change product selling rates.', true),
  ('product.change_cost', 'products', 'Change or view cost', 'View and change product purchase/default cost.', true),
  ('category.view', 'products', 'View categories', 'View active and inactive product categories.', false),
  ('category.create', 'products', 'Create categories', 'Add a product category.', false),
  ('category.edit', 'products', 'Edit categories', 'Edit ordering, images and category availability.', false),
  ('inventory.view', 'inventory', 'View inventory', 'View on-hand, reserved and available stock.', false),
  ('inventory.adjust', 'inventory', 'Adjust inventory', 'Create reasoned and audited stock adjustments.', true),
  ('inventory.valuation', 'inventory', 'View stock valuation', 'View purchase-cost-based stock valuation.', true),
  ('purchase.view', 'purchases', 'View purchases', 'View purchase documents and supplier selections.', true),
  ('purchase.create', 'purchases', 'Create purchase drafts', 'Create and edit purchase drafts.', true),
  ('purchase.confirm', 'purchases', 'Confirm purchases', 'Confirm purchases and increase stock.', true),
  ('purchase.return', 'purchases', 'Process purchase returns', 'Return stock through a controlled supplier workflow.', true),
  ('customer.view', 'customers', 'View customers', 'Search and view customer contact information.', false),
  ('customer.create', 'customers', 'Create customers', 'Add customer records.', false),
  ('customer.edit', 'customers', 'Edit customers', 'Edit basic customer contact information.', false),
  ('customer.ledger', 'customers', 'View customer ledgers', 'View full customer financial history and credit details.', true),
  ('supplier.view', 'suppliers', 'View suppliers', 'Search and select suppliers.', false),
  ('supplier.edit', 'suppliers', 'Edit suppliers', 'Create and edit supplier records.', true),
  ('supplier.financial', 'suppliers', 'View supplier finances', 'View supplier payables and complete supplier ledgers.', true),
  ('payment.view', 'payments', 'View payments', 'Search and view payment history.', true),
  ('payment.create', 'payments', 'Record payments', 'Record customer, COD and supplier payments.', true),
  ('payment.reverse', 'payments', 'Reverse payments', 'Correct payments through an audited reversal.', true),
  ('expense.view', 'expenses', 'View expenses', 'Search and view business expenses.', true),
  ('expense.create', 'expenses', 'Create expenses', 'Record a new expense and receipt.', false),
  ('expense.edit', 'expenses', 'Correct expenses', 'Correct an expense using the audited workflow.', true),
  ('expense.report', 'expenses', 'View expense analysis', 'View complete expense reports and trends.', true),
  ('gst.sale', 'gst', 'Create GST sales', 'Generate GST-compliant sales invoices.', false),
  ('gst.purchase', 'gst', 'Create GST purchases', 'Record GST purchase information.', true),
  ('gst.manage', 'gst', 'Manage GST', 'Manage GST rates, HSN/SAC and tax configuration.', true),
  ('gst.report', 'gst', 'View GST reports', 'View input/output GST reports and summaries.', true),
  ('report.orders', 'reports', 'Order reports', 'View and export order reports.', false),
  ('report.sales', 'reports', 'Sales reports', 'View and export sales reports.', false),
  ('report.purchases', 'reports', 'Purchase reports', 'View and export purchase reports.', true),
  ('report.inventory', 'reports', 'Inventory reports', 'View and export inventory movement reports.', false),
  ('report.expenses', 'reports', 'Expense reports', 'View and export complete expense reports.', true),
  ('report.gst', 'reports', 'GST reports', 'View and export GST reports.', true),
  ('report.financial', 'reports', 'Financial reports', 'View customer, supplier and payment financial reports.', true),
  ('report.profit', 'reports', 'Profit reports', 'View revenue, COGS, gross and net profit reports.', true),
  ('staff.manage', 'staff', 'Manage staff status', 'View staff and activate or deactivate staff access.', true),
  ('user.manage', 'staff', 'Create staff accounts', 'Create and manage staff authentication accounts.', true),
  ('permission.manage', 'staff', 'Manage permissions', 'Grant or revoke granular staff permissions.', true),
  ('settings.manage', 'settings', 'Manage business settings', 'Change business, invoice, stock and delivery settings.', true),
  ('audit.view', 'audit', 'View audit history', 'Review immutable business and staff activity logs.', true)
on conflict (code) do update set
  module = excluded.module,
  label = excluded.label,
  description = excluded.description,
  is_sensitive = excluded.is_sensitive;

with staff_defaults(permission_code) as (
  values
    ('dashboard.view'),
    ('order.view'),
    ('order.prepare'),
    ('order.dispatch'),
    ('order.deliver'),
    ('sale.view'),
    ('sale.create'),
    ('sale.confirm'),
    ('product.view'),
    ('category.view'),
    ('inventory.view'),
    ('customer.view'),
    ('customer.create'),
    ('customer.edit'),
    ('supplier.view')
), staff_roles(role) as (
  values
    ('staff'::public.app_role),
    ('sales_staff'::public.app_role),
    ('manager'::public.app_role),
    ('accountant'::public.app_role)
)
insert into public.role_permissions (role, permission_code, granted)
select staff_roles.role, staff_defaults.permission_code, true
from staff_roles cross join staff_defaults
on conflict (role, permission_code) do update set granted = excluded.granted;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'owner'
      and is_active = true
  ), false);
$$;

create or replace function public.has_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select case
      when profile.role = 'owner' then true
      else coalesce(
        (
          select override.granted
          from public.user_permission_overrides as override
          where override.user_id = profile.id
            and override.permission_code = requested_permission
        ),
        (
          select role_permission.granted
          from public.role_permissions as role_permission
          where role_permission.role = profile.role
            and role_permission.permission_code = requested_permission
        ),
        false
      )
    end
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active = true
  ), false);
$$;

create or replace function public.my_permissions()
returns table(permission_code text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select permission.code
  from public.permissions as permission
  where public.has_permission(permission.code)
  order by permission.code;
$$;

create or replace function public.get_product_costs()
returns table(product_id uuid, default_purchase_cost numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not (
    public.has_permission('product.change_cost')
    or public.has_permission('inventory.valuation')
    or public.has_permission('purchase.view')
  ) then
    raise exception 'purchase-cost permission required' using errcode = '42501';
  end if;

  return query
  select product.id, product.default_purchase_cost
  from public.products as product;
end;
$$;

create or replace function public.set_user_permissions(
  target_user_id uuid,
  requested_permissions text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_role public.app_role;
  normalized_permissions text[] := coalesce(requested_permissions, array[]::text[]);
begin
  if actor_id is null or not public.has_permission('permission.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null or target_role = 'customer' then
    raise exception 'staff profile not found' using errcode = 'P0002';
  end if;

  if target_role = 'owner' and not public.is_owner() then
    raise exception 'only an owner can manage owner permissions' using errcode = '42501';
  end if;

  if target_user_id = actor_id and not public.is_owner() then
    raise exception 'staff cannot change their own permissions' using errcode = '42501';
  end if;

  if exists (
    select 1
    from unnest(normalized_permissions) as requested(code)
    left join public.permissions as permission on permission.code = requested.code
    where permission.code is null
  ) then
    raise exception 'unknown permission requested' using errcode = '22023';
  end if;

  if not public.is_owner() and exists (
    select 1
    from unnest(normalized_permissions) as requested(code)
    where not public.has_permission(requested.code)
  ) then
    raise exception 'cannot grant a permission you do not hold' using errcode = '42501';
  end if;

  delete from public.user_permission_overrides
  where user_id = target_user_id;

  insert into public.user_permission_overrides (user_id, permission_code, granted, granted_by)
  select target_user_id, permission.code, true, actor_id
  from public.permissions as permission
  where permission.code = any(normalized_permissions)
    and not coalesce((
      select role_permission.granted
      from public.role_permissions as role_permission
      where role_permission.role = target_role
        and role_permission.permission_code = permission.code
    ), false);

  insert into public.user_permission_overrides (user_id, permission_code, granted, granted_by)
  select target_user_id, role_permission.permission_code, false, actor_id
  from public.role_permissions as role_permission
  where role_permission.role = target_role
    and role_permission.granted = true
    and not (role_permission.permission_code = any(normalized_permissions));

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'permissions.updated',
    'profile',
    target_user_id::text,
    jsonb_build_object('permissions', to_jsonb(normalized_permissions))
  );
end;
$$;

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Direct SQL and nested trusted auth triggers do not carry an end-user UID.
  if auth.uid() is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'profile identity fields are managed by authentication' using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    if (new.role = 'owner' or old.role = 'owner') and not public.is_owner() then
      raise exception 'only an owner can assign the owner role' using errcode = '42501';
    elsif not public.has_permission('permission.manage') then
      raise exception 'role management permission required' using errcode = '42501';
    end if;
  end if;

  if new.is_active is distinct from old.is_active then
    if (new.role = 'owner' or old.role = 'owner') and not public.is_owner() then
      raise exception 'only an owner can change owner status' using errcode = '42501';
    elsif not public.has_permission('staff.manage') then
      raise exception 'staff management permission required' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_security_fields
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.full_name is distinct from old.full_name then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'profile.updated',
      'profile',
      new.id::text,
      jsonb_build_object(
        'role_before', old.role,
        'role_after', new.role,
        'active_before', old.is_active,
        'active_after', new.is_active,
        'name_before', old.full_name,
        'name_after', new.full_name
      )
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_change
after update on public.profiles
for each row execute function public.audit_profile_change();

create or replace function public.audit_catalogue_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  record_id text;
  details jsonb;
begin
  if tg_op = 'INSERT' then
    record_id := new.id::text;
    details := jsonb_build_object('new', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    record_id := new.id::text;
    details := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
  else
    record_id := old.id::text;
    details := jsonb_build_object('old', to_jsonb(old));
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), lower(tg_table_name) || '.' || lower(tg_op), tg_table_name, record_id, details);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger products_audit_change
after insert or update or delete on public.products
for each row execute function public.audit_catalogue_change();

create trigger categories_audit_change
after insert or update or delete on public.categories
for each row execute function public.audit_catalogue_change();

create or replace function public.enforce_product_permissions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.has_permission('product.create') then
      raise exception 'product creation permission required' using errcode = '42501';
    end if;
    if not public.has_permission('product.change_price') then
      raise exception 'selling-rate permission required' using errcode = '42501';
    end if;
    if new.default_purchase_cost <> 0 and not public.has_permission('product.change_cost') then
      raise exception 'purchase-cost permission required' using errcode = '42501';
    end if;
    if (new.gst_rate <> 0 or new.hsn_sac is not null or new.tax_classification <> 'taxable')
       and not public.has_permission('gst.manage') then
      raise exception 'GST management permission required' using errcode = '42501';
    end if;
  else
    if not public.has_permission('product.edit') then
      raise exception 'product edit permission required' using errcode = '42501';
    end if;
    if new.selling_price is distinct from old.selling_price
       and not public.has_permission('product.change_price') then
      raise exception 'selling-rate permission required' using errcode = '42501';
    end if;
    if new.default_purchase_cost is distinct from old.default_purchase_cost
       and not public.has_permission('product.change_cost') then
      raise exception 'purchase-cost permission required' using errcode = '42501';
    end if;
    if (
      new.gst_rate is distinct from old.gst_rate
      or new.hsn_sac is distinct from old.hsn_sac
      or new.tax_classification is distinct from old.tax_classification
    ) and not public.has_permission('gst.manage') then
      raise exception 'GST management permission required' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger products_enforce_permissions
before insert or update on public.products
for each row execute function public.enforce_product_permissions();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_changed on auth.users;

create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permission_overrides enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Users can update their own name" on public.profiles;

create policy "Users can update their own profile name"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Authorized staff can read staff profiles"
on public.profiles for select
to authenticated
using (
  role <> 'customer'
  and (
    public.has_permission('staff.manage')
    or public.has_permission('user.manage')
    or public.has_permission('permission.manage')
  )
);

create policy "Authorized staff can update staff profiles"
on public.profiles for update
to authenticated
using (
  role <> 'customer'
  and (
    public.has_permission('staff.manage')
    or public.has_permission('permission.manage')
  )
)
with check (role <> 'customer');

create policy "Authenticated users can read permission catalogue"
on public.permissions for select
to authenticated
using (true);

create policy "Permission managers can read role defaults"
on public.role_permissions for select
to authenticated
using (public.has_permission('permission.manage'));

create policy "Permission managers can read permission overrides"
on public.user_permission_overrides for select
to authenticated
using (public.has_permission('permission.manage'));

create policy "Authorized users can view audit logs"
on public.audit_logs for select
to authenticated
using (public.has_permission('audit.view'));

create policy "Staff can read all categories"
on public.categories for select
to authenticated
using (public.has_permission('category.view'));

create policy "Authorized staff can create categories"
on public.categories for insert
to authenticated
with check (public.has_permission('category.create'));

create policy "Authorized staff can update categories"
on public.categories for update
to authenticated
using (public.has_permission('category.edit'))
with check (public.has_permission('category.edit'));

create policy "Staff can read all products"
on public.products for select
to authenticated
using (public.has_permission('product.view'));

create policy "Authorized staff can create products"
on public.products for insert
to authenticated
with check (public.has_permission('product.create'));

create policy "Authorized staff can update products"
on public.products for update
to authenticated
using (public.has_permission('product.edit'))
with check (public.has_permission('product.edit'));

revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.permissions, public.role_permissions, public.user_permission_overrides to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.categories to authenticated;
revoke select on public.products from public, anon, authenticated;
grant select (
  id,
  sku,
  slug,
  name,
  description,
  category_id,
  image_path,
  selling_price,
  unit,
  hsn_sac,
  gst_rate,
  tax_classification,
  minimum_stock,
  is_active,
  created_at,
  updated_at
) on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;

revoke all on function public.is_owner() from public;
revoke all on function public.has_permission(text) from public;
revoke all on function public.my_permissions() from public;
revoke all on function public.get_product_costs() from public;
revoke all on function public.set_user_permissions(uuid, text[]) from public;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.my_permissions() to authenticated;
grant execute on function public.get_product_costs() to authenticated;
grant execute on function public.set_user_permissions(uuid, text[]) to authenticated;
