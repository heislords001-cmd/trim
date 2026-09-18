-- ============================================================
-- Barber Marketplace: core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

create type user_role as enum ('customer', 'barber', 'admin');
create type barber_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');

-- One row per auth user. Created automatically by the trigger below.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A barber's business. owner_id points at the account that manages it.
create table public.barber_profiles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  description text,
  business_phone text,
  whatsapp_number text,
  logo_url text,
  status barber_status not null default 'pending',
  is_verified boolean not null default false,
  rating_average numeric(2,1) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index barber_profiles_owner_idx on public.barber_profiles(owner_id);
create index barber_profiles_status_idx on public.barber_profiles(status);

-- One physical location per barber business (extend to many for future multi-branch support).
create table public.business_locations (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null unique references public.barber_profiles(id) on delete cascade,
  address text not null,
  city text not null,
  state_region text,
  country text not null,
  geog geography(Point, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_locations_geog_idx on public.business_locations using gist(geog);

create table public.services (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  name text not null,
  price_naira numeric(10,2) not null check (price_naira >= 0),
  duration_minutes integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index services_barber_idx on public.services(barber_id);

-- 0 = Sunday ... 6 = Saturday, one row per day per barber
create table public.business_hours (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time time,
  close_time time,
  unique (barber_id, day_of_week)
);

create table public.barber_images (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  image_url text not null,
  image_type text not null default 'shop' check (image_type in ('shop', 'work', 'logo')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index barber_images_barber_idx on public.barber_images(barber_id);

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (barber_id, customer_id)
);
create index reviews_barber_idx on public.reviews(barber_id);

create table public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, barber_id)
);

create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  status booking_status not null default 'requested',
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index bookings_barber_idx on public.bookings(barber_id);
create index bookings_customer_idx on public.bookings(customer_id);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  barber_id uuid references public.barber_profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Auto-create a profile row whenever someone signs up.
-- Role can be passed in at signup via options.data.role (defaults to customer).
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Keep rating_average / rating_count in sync whenever reviews change.
-- ------------------------------------------------------------
create or replace function public.recalculate_barber_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_barber uuid := coalesce(new.barber_id, old.barber_id);
begin
  update public.barber_profiles bp
  set rating_average = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.barber_id = target_barber), 0),
      rating_count = (select count(*) from public.reviews r where r.barber_id = target_barber)
  where bp.id = target_barber;
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute procedure public.recalculate_barber_rating();

-- Storage buckets for barber-uploaded media
insert into storage.buckets (id, name, public)
values ('barber-logos', 'barber-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('barber-photos', 'barber-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- External / unclaimed listings.
-- Keeps the app useful in areas with few or no registered barbers yet:
-- these rows are barbershops pulled in from an outside source (OSM
-- Overpass, Google Places, etc — see scripts/sync-external-listings.ts)
-- rather than accounts on the platform. They show up in search
-- alongside real barber_profiles rows, clearly marked "Unclaimed", with
-- no booking/chat/services since nobody owns them yet.
-- ============================================================

create table public.external_listings (
  id uuid primary key default uuid_generate_v4(),
  source text not null,              -- e.g. 'osm', 'google_places'
  external_id text not null,         -- the source's own id, for de-duping on re-sync
  name text not null,
  address text,
  city text,
  country text,
  geog geography(Point, 4326) not null,
  raw_tags jsonb,                    -- whatever extra data the source gave us
  claimed_by_barber_id uuid references public.barber_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);
create index external_listings_geog_idx on public.external_listings using gist(geog);

alter table public.external_listings enable row level security;
create policy "external_listings_public_read" on public.external_listings
  for select using (claimed_by_barber_id is null);

-- ============================================================
-- Chat. One conversation per (customer, barber) pair — reused across
-- however many messages/bookings they exchange over time. Only ever
-- between a customer and a *registered* barber; external/unclaimed
-- listings have no account to message.
-- ============================================================

create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  barber_id uuid not null references public.barber_profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_id, barber_id)
);
create index conversations_customer_idx on public.conversations(customer_id);
create index conversations_barber_idx on public.conversations(barber_id);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id, created_at);

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.touch_conversation();

-- Lets the chat UI subscribe to new messages in real time (see
-- src/components/chat/ChatThread.tsx).
alter publication supabase_realtime add table public.messages;
