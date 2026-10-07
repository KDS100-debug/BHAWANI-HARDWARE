alter table public.profiles
add column if not exists phone text,
add column if not exists phone_verified_at timestamptz,
add column if not exists requires_account_completion boolean not null default false;

update public.profiles as profile
set
  email = nullif(lower(trim(auth_user.email)), ''),
  phone = nullif(auth_user.phone, ''),
  phone_verified_at = auth_user.phone_confirmed_at
from auth.users as auth_user
where auth_user.id = profile.id;

update public.profiles
set requires_account_completion = true
where phone is null
   or phone_verified_at is null
   or full_name is null
   or length(trim(full_name)) < 2;

create unique index if not exists profiles_phone_unique_idx
on public.profiles (phone)
where phone is not null;

alter table public.profiles
drop constraint if exists profiles_phone_e164_check,
add constraint profiles_phone_e164_check
check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
drop constraint if exists profiles_phone_required_check,
add constraint profiles_phone_required_check
check (phone is not null or requires_account_completion),
drop constraint if exists profiles_full_name_required_check,
add constraint profiles_full_name_required_check
check (
  (full_name is not null and length(trim(full_name)) between 2 and 120)
  or requires_account_completion
),
drop constraint if exists profiles_email_normalized_check,
add constraint profiles_email_normalized_check
check (email is null or email = lower(trim(email)));

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
      and requires_account_completion = false
      and phone_verified_at is not null
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
      and profile.requires_account_completion = false
      and profile.phone_verified_at is not null
  ), false);
$$;

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.phone is distinct from old.phone
     or new.phone_verified_at is distinct from old.phone_verified_at
     or new.requires_account_completion is distinct from old.requires_account_completion then
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

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.full_name is distinct from old.full_name
     or new.email is distinct from old.email
     or new.phone is distinct from old.phone then
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
        'name_changed', new.full_name is distinct from old.full_name,
        'email_changed', new.email is distinct from old.email,
        'phone_changed', new.phone is distinct from old.phone
      )
    );
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := nullif(lower(trim(new.email)), '');
  normalized_phone text := nullif(new.phone, '');
  normalized_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  insert into public.profiles (
    id,
    email,
    phone,
    phone_verified_at,
    full_name,
    requires_account_completion
  )
  values (
    new.id,
    normalized_email,
    normalized_phone,
    new.phone_confirmed_at,
    normalized_name,
    false
  )
  on conflict (id) do update set
    email = normalized_email,
    phone = normalized_phone,
    phone_verified_at = new.phone_confirmed_at,
    full_name = coalesce(normalized_name, public.profiles.full_name),
    requires_account_completion = case
      when normalized_phone is not null
        and new.phone_confirmed_at is not null
        and length(coalesce(normalized_name, public.profiles.full_name, '')) >= 2
      then false
      else public.profiles.requires_account_completion
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_changed on auth.users;

create trigger on_auth_user_changed
after insert or update of email, phone, phone_confirmed_at, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

alter function public.set_updated_at() set search_path = public, pg_temp;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_security_fields() from public, anon, authenticated;
revoke all on function public.audit_profile_change() from public, anon, authenticated;
revoke all on function public.audit_catalogue_change() from public, anon, authenticated;
revoke all on function public.enforce_product_permissions() from public, anon, authenticated;

revoke all on function public.is_owner() from public, anon, authenticated;
revoke all on function public.has_permission(text) from public, anon, authenticated;
revoke all on function public.my_permissions() from public, anon, authenticated;
revoke all on function public.get_product_costs() from public, anon, authenticated;
revoke all on function public.set_user_permissions(uuid, text[]) from public, anon, authenticated;

grant execute on function public.is_owner() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.my_permissions() to authenticated;
grant execute on function public.get_product_costs() to authenticated;
grant execute on function public.set_user_permissions(uuid, text[]) to authenticated;
