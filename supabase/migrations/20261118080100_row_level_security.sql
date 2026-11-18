-- Row Level Security on every table.
-- Principles:
--   * anonymous visitors read only the public catalogue and business info;
--   * a signed-in client reads only her own rows;
--   * every write made on behalf of a client goes through server code that
--     validates input (Zod) and uses the service role or SECURITY DEFINER RPCs;
--   * the admin (app_metadata.role = 'admin') can do everything.

alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_variants enable row level security;
alter table public.business_settings enable row level security;
alter table public.opening_hours enable row level security;
alter table public.day_overrides enable row level security;
alter table public.blocks enable row level security;
alter table public.clients enable row level security;
alter table public.client_notes enable row level security;
alter table public.appointments enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.waitlist_offers enable row level security;
alter table public.slot_holds enable row level security;
alter table public.notification_log enable row level security;
alter table public.gallery_images enable row level security;
alter table public.rate_limits enable row level security;

-- Admin: full access everywhere ---------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'service_categories', 'services', 'service_variants', 'business_settings',
    'opening_hours', 'day_overrides', 'blocks', 'clients', 'client_notes',
    'appointments', 'waitlist_entries', 'waitlist_offers', 'slot_holds',
    'notification_log', 'gallery_images', 'rate_limits'
  ]
  loop
    execute format(
      'create policy admin_all on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t
    );
  end loop;
end;
$$;

-- Public catalogue ------------------------------------------------------------
create policy public_read_active on public.service_categories
  for select to anon, authenticated using (is_active);

create policy public_read_active on public.services
  for select to anon, authenticated using (is_active);

create policy public_read_active on public.service_variants
  for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.services s where s.id = service_id and s.is_active)
  );

create policy public_read on public.business_settings
  for select to anon, authenticated using (true);

create policy public_read on public.opening_hours
  for select to anon, authenticated using (true);

create policy public_read_published on public.gallery_images
  for select to anon, authenticated using (is_published);

-- Client-owned data -------------------------------------------------------------
create policy own_row_read on public.clients
  for select to authenticated using (user_id = (select auth.uid()));

create policy own_row_update on public.clients
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- A client may only edit her contact details and marketing preference.
revoke update on public.clients from authenticated;
grant update (full_name, phone, marketing_email) on public.clients to authenticated;
-- Column grants above would also restrict the admin; the admin edits clients
-- through server code with the service role.

create policy own_rows_read on public.appointments
  for select to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = (select auth.uid())
    )
  );

create policy own_rows_read on public.waitlist_entries
  for select to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = (select auth.uid())
    )
  );

-- Nothing else is granted to anon/authenticated: day_overrides, blocks,
-- client_notes, waitlist_offers, slot_holds, notification_log and rate_limits
-- are admin/service-role only.

-- Defense in depth: anonymous users never write anything.
revoke insert, update, delete on all tables in schema public from anon;
