-- =====================================================================
-- Dar Al-Hayaa — Schéma Supabase complet
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- Ce script est idempotent : vous pouvez le relancer sans risque.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILS (liés à auth.users — l'authentification native Supabase)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null default '',
  last_name     text not null default '',
  email         text not null,
  phone         text,
  role          text not null default 'client' check (role in ('client', 'manager', 'admin')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- ---------------------------------------------------------------------
-- 2. CATALOGUE
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id            text primary key,
  name          text not null,
  name_ar       text,
  icon          text,
  description   text,
  count         integer not null default 0,
  color         text,
  image         text,
  subcategories jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.products (
  id             text primary key,
  name           text not null,
  category       text references public.categories(id) on delete set null,
  subcategory    text,
  price          numeric(12,2) not null default 0,
  original_price numeric(12,2),
  discount       integer not null default 0,
  rating         numeric(3,2) not null default 0,
  reviews_count  integer not null default 0,
  stock          integer not null default 0,
  is_new         boolean not null default false,
  is_bestseller  boolean not null default false,
  featured       boolean not null default false,
  colors         jsonb not null default '[]'::jsonb,
  sizes          jsonb not null default '[]'::jsonb,
  images         jsonb not null default '[]'::jsonb,
  tags           jsonb not null default '[]'::jsonb,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists products_category_idx    on public.products (category);
create index if not exists products_subcategory_idx on public.products (subcategory);
create index if not exists products_featured_idx     on public.products (featured);

-- ---------------------------------------------------------------------
-- 3. CODES PROMO
-- ---------------------------------------------------------------------
create table if not exists public.coupons (
  code         text primary key,
  discount     integer not null default 0,
  min_purchase numeric(12,2) not null default 0,
  max_uses     integer,
  uses_count   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. COMMANDES
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id               text primary key,
  user_id          uuid references public.profiles(id) on delete set null,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  total            numeric(12,2) not null default 0,
  subtotal         numeric(12,2) not null default 0,
  shipping         numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  coupon_code      text,
  payment_method   text,
  shipping_address jsonb,
  phone            text,
  email            text,
  tracking_number  text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_idx     on public.orders (user_id);
create index if not exists orders_tracking_idx on public.orders (tracking_number);

create table if not exists public.order_items (
  id         text primary key,
  order_id   text not null references public.orders(id) on delete cascade,
  product_id text,
  name       text,
  image      text,
  quantity   integer not null default 1,
  price      numeric(12,2) not null default 0,
  color      text,
  size       text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_tracking (
  id         text primary key,
  order_id   text not null references public.orders(id) on delete cascade,
  step_label text not null,
  is_done    boolean not null default false,
  step_date  timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists order_tracking_order_idx on public.order_tracking (order_id);

create table if not exists public.payments (
  id             text primary key,
  order_id       text references public.orders(id) on delete cascade,
  method         text,
  amount         numeric(12,2) not null default 0,
  status         text not null default 'pending'
                 check (status in ('pending','completed','failed','refunded')),
  transaction_id text,
  phone          text,
  created_at     timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);

-- ---------------------------------------------------------------------
-- 5. DONNÉES UTILISATEUR
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  verified   boolean not null default false,
  status     text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews (product_id);

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text,
  first_name  text,
  last_name   text,
  address     text,
  city        text,
  postal_code text,
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text,
  title      text not null,
  message    text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id);

-- =====================================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================================

-- Vérifie si l'utilisateur courant est admin/manager.
-- SECURITY DEFINER => évite la récursion infinie dans les policies de profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','manager') and is_active
  );
$$;

-- Crée automatiquement un profil à chaque inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Met à jour updated_at automatiquement.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Recalcule la note moyenne d'un produit après chaque avis.
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid text := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating        = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r
                               where r.product_id = pid and r.status = 'approved'), 0),
      reviews_count = (select count(*) from public.reviews r
                       where r.product_id = pid and r.status = 'approved')
  where p.id = pid;
  return null;
end;
$$;

drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- Validation d'un code promo (accessible aux visiteurs, sans exposer la table).
create or replace function public.validate_coupon(p_code text, p_subtotal numeric default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare c public.coupons;
begin
  select * into c from public.coupons where upper(code) = upper(trim(p_code));

  if c.code is null then
    return jsonb_build_object('success', false, 'message', 'Code promo invalide');
  end if;
  if not c.is_active then
    return jsonb_build_object('success', false, 'message', 'Ce code promo n''est plus actif');
  end if;
  if c.max_uses is not null and c.uses_count >= c.max_uses then
    return jsonb_build_object('success', false, 'message', 'Ce code promo a atteint sa limite d''utilisation');
  end if;
  if p_subtotal < c.min_purchase then
    return jsonb_build_object('success', false,
      'message', 'Achat minimum de ' || c.min_purchase::text || ' FCFA requis');
  end if;

  return jsonb_build_object(
    'success', true,
    'discount', c.discount,
    'message', 'Code promo appliqué : -' || c.discount::text || '%'
  );
end;
$$;

-- Statistiques du tableau de bord admin.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès refusé';
  end if;

  return jsonb_build_object(
    'revenue',        coalesce((select sum(total) from public.orders where status <> 'cancelled'), 0),
    'orders',         (select count(*) from public.orders),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'customers',      (select count(*) from public.profiles where role = 'client'),
    'products',       (select count(*) from public.products),
    'low_stock',      (select count(*) from public.products where stock > 0 and stock <= 5),
    'out_of_stock',   (select count(*) from public.products where stock = 0),
    'reviews',        (select count(*) from public.reviews)
  );
end;
$$;

-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.coupons        enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_tracking enable row level security;
alter table public.payments       enable row level security;
alter table public.favorites      enable row level security;
alter table public.reviews        enable row level security;
alter table public.addresses      enable row level security;
alter table public.notifications  enable row level security;

-- ---- profiles ----
drop policy if exists profiles_select_own    on public.profiles;
drop policy if exists profiles_select_admin  on public.profiles;
drop policy if exists profiles_update_own    on public.profiles;
drop policy if exists profiles_admin_all     on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- catalogue : lecture publique, écriture admin ----
drop policy if exists categories_read      on public.categories;
drop policy if exists categories_admin     on public.categories;
create policy categories_read  on public.categories for select using (true);
create policy categories_admin on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_read  on public.products;
drop policy if exists products_admin on public.products;
create policy products_read  on public.products for select using (true);
create policy products_admin on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- coupons : lecture des coupons actifs, écriture admin ----
drop policy if exists coupons_read  on public.coupons;
drop policy if exists coupons_admin on public.coupons;
create policy coupons_read  on public.coupons for select using (is_active or public.is_admin());
create policy coupons_admin on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- orders ----
drop policy if exists orders_select_own    on public.orders;
drop policy if exists orders_insert_own    on public.orders;
drop policy if exists orders_admin_all     on public.orders;
create policy orders_select_own on public.orders
  for select using (user_id = auth.uid());
create policy orders_insert_own on public.orders
  for insert with check (user_id = auth.uid());
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- lignes de commande / suivi / paiements : via la commande parente ----
drop policy if exists order_items_own   on public.order_items;
drop policy if exists order_items_admin on public.order_items;
create policy order_items_own on public.order_items
  for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_items_admin on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_tracking_own   on public.order_tracking;
drop policy if exists order_tracking_admin on public.order_tracking;
create policy order_tracking_own on public.order_tracking
  for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_tracking_admin on public.order_tracking
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payments_own   on public.payments;
drop policy if exists payments_admin on public.payments;
create policy payments_own on public.payments
  for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy payments_admin on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- favoris ----
drop policy if exists favorites_own   on public.favorites;
drop policy if exists favorites_admin on public.favorites;
create policy favorites_own on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy favorites_admin on public.favorites
  for select using (public.is_admin());

-- ---- avis : lecture publique, écriture par l'auteur ----
drop policy if exists reviews_read   on public.reviews;
drop policy if exists reviews_own    on public.reviews;
drop policy if exists reviews_admin  on public.reviews;
create policy reviews_read on public.reviews
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy reviews_own  on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_admin on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- adresses ----
drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- notifications ----
drop policy if exists notifications_own   on public.notifications;
drop policy if exists notifications_admin on public.notifications;
create policy notifications_own on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 8. CODES PROMO PAR DÉFAUT
-- =====================================================================
insert into public.coupons (code, discount, min_purchase, is_active) values
  ('NOUR10', 10, 0, true),
  ('RAMADAN20', 20, 0, true),
  ('BIENVENUE15', 15, 0, true)
on conflict (code) do nothing;

-- =====================================================================
-- 9. DEVENIR ADMINISTRATEUR
-- Créez d'abord votre compte via /inscription dans l'application,
-- puis exécutez la ligne ci-dessous avec VOTRE email :
-- =====================================================================
-- update public.profiles set role = 'admin' where email = 'admin@daralhayaa.com';
