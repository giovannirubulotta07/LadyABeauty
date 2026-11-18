-- Calendar write guards.
--
-- Three layers protect against double bookings (docs/proposta-tecnica.md §2):
--   1. the EXCLUDE constraint on appointments (always on, whatever the caller);
--   2. these functions: every calendar write takes a per-day advisory lock and
--      re-checks blocks and waitlist holds, which live in other tables;
--   3. the server re-runs the availability engine before calling them.
--
-- They are SECURITY DEFINER and only executable by the service role: browsers
-- never call them directly, the Next.js server does after validating input.

-- Serialises all calendar writes touching one Paris calendar day.
create or replace function public.lock_calendar_day(p_day date)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('calendar:' || p_day::text, 0));
end;
$$;

-- Locks every Paris day touched by a range, always in ascending order
-- (consistent ordering prevents deadlocks between multi-day writes).
create or replace function public.lock_calendar_range(p_period tstzrange)
returns void
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_day date := (lower(p_period) at time zone 'Europe/Paris')::date;
  v_last date := ((upper(p_period) - interval '1 microsecond') at time zone 'Europe/Paris')::date;
begin
  while v_day <= v_last loop
    perform public.lock_calendar_day(v_day);
    v_day := v_day + 1;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Appointments
-- Errors (SQLSTATE P0001, message): SLOT_BLOCKED, SLOT_HELD, SLOT_TAKEN,
-- INVALID_DURATION.
-- ---------------------------------------------------------------------------
create or replace function public.create_appointment(
  p_client_id uuid,
  p_service_id uuid,
  p_variant_id uuid,
  p_service_name text,
  p_variant_name text,
  p_duration_min integer,
  p_price_cents integer,
  p_start timestamptz,
  p_source public.appointment_source,
  p_client_note text default null,
  p_created_by uuid default null,
  -- The waitlist offer the client is redeeming: her own hold does not block her.
  p_hold_offer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period tstzrange;
  v_id uuid;
begin
  if p_duration_min is null or p_duration_min not between 5 and 480 then
    raise exception using errcode = 'P0001', message = 'INVALID_DURATION';
  end if;
  v_period := tstzrange(p_start, p_start + make_interval(mins => p_duration_min), '[)');

  perform public.lock_calendar_range(v_period);

  if exists (select 1 from public.blocks b where b.period && v_period) then
    raise exception using errcode = 'P0001', message = 'SLOT_BLOCKED';
  end if;

  if exists (
    select 1 from public.slot_holds h
    where h.period && v_period
      and h.released_at is null
      and h.expires_at > now()
      and h.offer_id is distinct from p_hold_offer_id
  ) then
    raise exception using errcode = 'P0001', message = 'SLOT_HELD';
  end if;

  begin
    insert into public.appointments (
      client_id, service_id, variant_id, service_name, variant_name,
      duration_min, price_cents, period, status, source, client_note, created_by
    ) values (
      p_client_id, p_service_id, p_variant_id, p_service_name, p_variant_name,
      p_duration_min, p_price_cents, v_period, 'confirmed', p_source, p_client_note, p_created_by
    )
    returning id into v_id;
  exception when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'SLOT_TAKEN';
  end;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Blocks (holidays, time ranges). Refuses to hide an existing appointment:
-- the admin must move or cancel it first. Error: SLOT_TAKEN.
-- ---------------------------------------------------------------------------
create or replace function public.create_block(
  p_period tstzrange,
  p_reason text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_valid_period(p_period) then
    raise exception using errcode = 'P0001', message = 'INVALID_PERIOD';
  end if;

  perform public.lock_calendar_range(p_period);

  if exists (
    select 1 from public.appointments a
    where a.period && p_period and a.status <> 'cancelled'
  ) then
    raise exception using errcode = 'P0001', message = 'SLOT_TAKEN';
  end if;

  insert into public.blocks (period, reason, created_by)
  values (p_period, p_reason, p_created_by)
  returning id into v_id;
  return v_id;
end;
$$;

-- Only the server (service role) may call these.
revoke all on function public.lock_calendar_day(date) from public, anon, authenticated;
revoke all on function public.lock_calendar_range(tstzrange) from public, anon, authenticated;
revoke all on function public.create_appointment(
  uuid, uuid, uuid, text, text, integer, integer, timestamptz, public.appointment_source, text, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.create_block(tstzrange, text, uuid) from public, anon, authenticated;

grant execute on function public.lock_calendar_day(date) to service_role;
grant execute on function public.lock_calendar_range(tstzrange) to service_role;
grant execute on function public.create_appointment(
  uuid, uuid, uuid, text, text, integer, integer, timestamptz, public.appointment_source, text, uuid, uuid
) to service_role;
grant execute on function public.create_block(tstzrange, text, uuid) to service_role;
