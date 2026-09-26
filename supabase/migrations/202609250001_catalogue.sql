create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  image_path text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(trim(sku)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  category_id uuid references public.categories(id) on delete restrict,
  image_path text,
  selling_price numeric(18, 2) not null check (selling_price >= 0),
  default_purchase_cost numeric(18, 4) not null default 0 check (default_purchase_cost >= 0),
  unit text not null default 'piece' check (length(trim(unit)) between 1 and 32),
  hsn_sac text,
  gst_rate numeric(5, 2) not null default 0 check (gst_rate >= 0 and gst_rate <= 100),
  tax_classification text not null default 'taxable',
  minimum_stock numeric(18, 4) not null default 0 check (minimum_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index products_category_id_idx on public.products(category_id);
create index products_active_category_idx on public.products(category_id, is_active);
create index products_name_search_idx on public.products using gin (name gin_trgm_ops);
create index products_sku_search_idx on public.products using gin (sku gin_trgm_ops);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active products in active categories"
on public.products for select
to anon, authenticated
using (
  is_active = true
  and (category_id is null or exists (
    select 1 from public.categories
    where categories.id = products.category_id and categories.is_active = true
  ))
);