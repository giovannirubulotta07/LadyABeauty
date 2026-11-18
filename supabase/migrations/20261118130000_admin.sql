-- Admin area: calendar writes that need the same guarantees as bookings,
-- atomic replacement of the weekly hours, and the public media bucket.
-- Like the booking guards, these functions are only executable by the
-- service role: the Next.js server checks the admin session first.

-- ---------------------------------------------------------------------------
-- Move an appointment (new start and/or duration).
-- Locks every day touched by the old and the new period, re-checks blocks and
-- waitlist holds, and lets the EXCLUDE constraint catch overlaps.
-- Errors (P0001): NOT_FOUND, NOT_CONFIRMED, INVALID_DURATION, SLOT_BLOCKED,
-- SLOT_HELD, SLOT_TAKEN. Returns the previous period.
-- ---------------------------------------------------------------------------
create or replace function public.move_appointment(
  p_appointment_id uuid,
  p_start timestamptz,
  p_duration_min integer
)
returns tstzrange
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old tstzrange;
  v_status public.appointment_status;
  v_new tstzrange;
begin
  if p_duration_min is null or p_duration_min not between 5 and 480 then
    raise exception using errcode = 'P0001', message = 'INVALID_DURATION';
  end if;
  v_new := tstzrange(p_start, p_start + make_interval(mins => p_duration_min), '[)');

  select a.period into v_old from public.appointments a where a.id = p_appointment_id;
  if v_old is null then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  -- One ascending pass over all days involved (old and new) avoids deadlocks.
  perform public.lock_calendar_range(
    tstzrange(least(lower(v_old), lower(v_new)), greatest(upper(v_old), upper(v_new)), '[)')
  );

  select a.period, a.status into v_old, v_status
  from public.appointments a where a.id = p_appointment_id for update;
  if v_status <> 'confirmed' then
    raise exception using errcode = 'P0001', message = 'NOT_CONFIRMED';
  end if;

  if exists (select 1 from public.blocks b where b.period && v_new) then
    raise exception using errcode = 'P0001', message = 'SLOT_BLOCKED';
  end if;

  if exists (
    select 1 from public.slot_holds h
    where h.period && v_new and h.released_at is null and h.expires_at > now()
  ) then
    raise exception using errcode = 'P0001', message = 'SLOT_HELD';
  end if;

  begin
    update public.appointments
    set period = v_new, duration_min = p_duration_min
    where id = p_appointment_id;
  exception when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'SLOT_TAKEN';
  end;

  return v_old;
end;
$$;

-- ---------------------------------------------------------------------------
-- Replace the weekly opening hours in one transaction.
-- p_hours: [{"weekday":1,"opens":"10:00","closes":"14:00"}, ...]
-- Overlaps are rejected by the opening_hours EXCLUDE constraint.
-- ---------------------------------------------------------------------------
create or replace function public.replace_opening_hours(p_hours jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(p_hours) <> 'array' then
    raise exception using errcode = 'P0001', message = 'INVALID_HOURS';
  end if;
  delete from public.opening_hours where true;
  insert into public.opening_hours (weekday, opens, closes)
  select (h ->> 'weekday')::smallint, (h ->> 'opens')::time, (h ->> 'closes')::time
  from jsonb_array_elements(p_hours) as h;
end;
$$;

revoke all on function public.move_appointment(uuid, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.replace_opening_hours(jsonb) from public, anon, authenticated;
grant execute on function public.move_appointment(uuid, timestamptz, integer) to service_role;
grant execute on function public.replace_opening_hours(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Public bucket for the logo and gallery photos. Uploads go through the
-- server (service role) after resizing; visitors only read.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
