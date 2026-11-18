-- Lady A Beauty — initial schema.
-- Conventions: timestamps are timestamptz (UTC), time ranges are half-open
-- tstzrange '[start, end)', money is stored in integer cents.

create extension if not exists btree_gist with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.appointment_status as enum ('confirmed', 'cancelled', 'completed', 'no_show');
create type public.appointment_source as enum ('online', 'admin', 'waitlist');
create type public.waitlist_status as enum ('waiting', 'notified', 'booked', 'expired', 'cancelled');
create type public.offer_status as enum ('offered', 'accepted', 'expired', 'superseded');
create type public.notification_status as enum ('queued', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Admin role lives in auth.users.raw_app_meta_data, which only the service
-- role can write. It is exposed in the JWT as app_metadata.role.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A valid booking range: non-empty, bounded, half-open.
create or replace function public.is_valid_period(p tstzrange)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p is not null
    and not isempty(p)
    and not lower_inf(p) and not upper_inf(p)
    and lower_inc(p) and not upper_inc(p);
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  duration_min integer not null check (duration_min between 5 and 480),
  price_cents integer check (price_cents >= 0),
  price_is_from boolean not null default false,
  deposit_cents integer check (deposit_cents >= 0),
  bookable_online boolean not null default true,
  -- Highlighted on the home page
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_category_sort_idx on public.services (category_id, sort_order);

create table public.service_variants (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  -- null = inherit from the parent service
  duration_min integer check (duration_min between 5 and 480),
  price_cents integer check (price_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, name)
);

-- ---------------------------------------------------------------------------
-- Business settings (single row) and calendar configuration
-- ---------------------------------------------------------------------------
create table public.business_settings (
  id boolean primary key default true check (id),
  name text not null,
  tagline text not null default '',
  legal_name text,
  siret text check (siret is null or siret ~ '^[0-9]{14}$'),
  phone text,
  email text,
  instagram_url text,
  address_line1 text not null,
  address_line2 text,
  postal_code text not null,
  city text not null,
  country_code text not null default 'FR' check (country_code ~ '^[A-Z]{2}$'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  timezone text not null default 'Europe/Paris' check (timezone = 'Europe/Paris'),
  min_notice_minutes integer not null default 120 check (min_notice_minutes between 0 and 10080),
  max_advance_days integer not null default 60 check (max_advance_days between 1 and 365),
  cancellation_cutoff_hours integer not null default 24 check (cancellation_cutoff_hours between 0 and 336),
  reference_starts time[] not null default '{10:00,12:00,14:30,16:00,18:00}',
  -- Starts at or after this local time are "sur demande" unless unlocked for the day.
  evening_lock_from time default '18:00',
  waitlist_exclusive_minutes integer not null default 30 check (waitlist_exclusive_minutes between 5 and 1440),
  waitlist_broadcast_before_hours integer not null default 12 check (waitlist_broadcast_before_hours between 0 and 168),
  waitlist_quiet_start time not null default '21:00',
  waitlist_quiet_end time not null default '08:00',
  reminder_send_time time not null default '09:00',
  logo_url text,
  home_content jsonb not null default '{}'::jsonb check (jsonb_typeof(home_content) = 'object'),
  updated_at timestamptz not null default now()
);

-- Weekly opening windows. Several rows per weekday = breaks in between.
-- weekday follows ISO 8601: 1 = Monday ... 7 = Sunday.
create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7),
  opens time not null,
  closes time not null,
  check (opens < closes),
  constraint opening_hours_no_overlap exclude using gist (
    weekday with =,
    tsrange('2000-01-01'::date + opens, '2000-01-01'::date + closes) with &&
  )
);

-- Per-day adjustments made by the admin.
create table public.day_overrides (
  day date primary key,
  evening_unlocked boolean not null default false,
  closed boolean not null default false,
  -- Optional replacement windows for that day: [{"opens":"10:00","closes":"13:00"}, ...]
  custom_hours jsonb check (custom_hours is null or jsonb_typeof(custom_hours) = 'array'),
  note text check (char_length(note) <= 500),
  updated_at timestamptz not null default now()
);

-- Manual blocks: holidays (whole days) or time ranges.
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  period tstzrange not null check (public.is_valid_period(period)),
  reason text check (char_length(reason) <= 200),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index blocks_period_idx on public.blocks using gist (period);

-- ---------------------------------------------------------------------------
-- Clients
-- A client may exist without an account (booked by the admin after a call or
-- an Instagram message). user_id is linked when she signs in with that email.
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email extensions.citext unique check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^\+?[0-9 .()-]{6,24}$'),
  marketing_email boolean not null default false,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index client_notes_client_idx on public.client_notes (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  variant_id uuid references public.service_variants (id) on delete set null,
  -- Snapshots keep history correct when the catalogue changes.
  service_name text not null,
  variant_name text,
  duration_min integer not null check (duration_min between 5 and 480),
  price_cents integer check (price_cents >= 0),
  period tstzrange not null check (public.is_valid_period(period)),
  status public.appointment_status not null default 'confirmed',
  source public.appointment_source not null,
  client_note text check (char_length(client_note) <= 500),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id) on delete set null,
  cancellation_reason text check (char_length(cancellation_reason) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The core guarantee: two non-cancelled appointments can never overlap,
  -- whatever the concurrency.
  constraint appointments_no_overlap exclude using gist (period with &&)
    where (status <> 'cancelled'),
  check ((status = 'cancelled') = (cancelled_at is not null))
);
create index appointments_client_idx on public.appointments (client_id, lower(period) desc);
create index appointments_start_idx on public.appointments (lower(period)) where status = 'confirmed';

-- ---------------------------------------------------------------------------
-- Waitlist
-- ---------------------------------------------------------------------------
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  variant_id uuid references public.service_variants (id) on delete cascade,
  day date not null,
  duration_min integer not null check (duration_min between 5 and 480),
  status public.waitlist_status not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index waitlist_entries_unique_active_idx on public.waitlist_entries (
  client_id, service_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), day
) where status in ('waiting', 'notified');
create index waitlist_entries_day_idx on public.waitlist_entries (day, status, created_at);

create table public.waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.waitlist_entries (id) on delete cascade,
  period tstzrange not null check (public.is_valid_period(period)),
  token_hash text not null unique,
  -- null = broadcast offer (no exclusivity)
  exclusive_until timestamptz,
  status public.offer_status not null default 'offered',
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
create index waitlist_offers_entry_idx on public.waitlist_offers (entry_id);
create index waitlist_offers_open_idx on public.waitlist_offers (exclusive_until) where status = 'offered';

-- Temporary reservation of a freed slot for the client holding an exclusive offer.
create table public.slot_holds (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.waitlist_offers (id) on delete cascade,
  period tstzrange not null check (public.is_valid_period(period)),
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index slot_holds_active_idx on public.slot_holds using gist (period) where released_at is null;

-- ---------------------------------------------------------------------------
-- Notifications, gallery, rate limiting
-- ---------------------------------------------------------------------------
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  channel text not null check (channel in ('email', 'sms')),
  recipient text not null,
  appointment_id uuid references public.appointments (id) on delete set null,
  offer_id uuid references public.waitlist_offers (id) on delete set null,
  -- e.g. 'reminder:<appointment id>:<start iso>' — guarantees at-most-once sends.
  idempotency_key text not null unique,
  status public.notification_status not null default 'queued',
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notification_log_created_idx on public.notification_log (created_at desc);
create index notification_log_appointment_idx on public.notification_log (appointment_id);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  -- Public URL or site-relative path of the optimised image.
  image_url text not null,
  -- Set when the file lives in Supabase Storage (needed to delete it).
  storage_path text,
  alt text not null default '' check (char_length(alt) <= 300),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger set_updated_at before update on public.service_categories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.service_variants for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.business_settings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.day_overrides for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.waitlist_entries for each row execute function public.set_updated_at();
