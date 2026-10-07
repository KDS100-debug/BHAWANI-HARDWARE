alter table public.profiles
drop constraint if exists profiles_phone_e164_check,
add constraint profiles_phone_e164_check
check (phone is null or phone ~ '^\+?[1-9][0-9]{7,14}$');

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
  if normalized_phone is not null then
    normalized_phone := regexp_replace(normalized_phone, '[^0-9]', '', 'g');
    if normalized_phone ~ '^[1-9][0-9]{7,14}$' then
      normalized_phone := '+' || normalized_phone;
    else
      normalized_phone := null;
    end if;
  end if;

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
