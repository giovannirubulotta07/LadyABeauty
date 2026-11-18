-- Waitlist: offers, holds, redemption, expiry.
-- Fairness rule (docs/proposta-tecnica.md §5): in order of registration, each
-- client gets an exclusive hold on a freed slot for N minutes; close to the
-- slot (or when nobody is left) offers go to everyone at once.

-- Starts the client should not be offered again: the times that were free
-- when she registered (she did not want them) and offers she let expire or
-- declined.
alter table public.waitlist_entries
  add column excluded_starts timestamptz[] not null default '{}';

-- At most one open offer per entry.
create unique index waitlist_offers_one_open_per_entry
  on public.waitlist_offers (entry_id) where status = 'offered';

-- ---------------------------------------------------------------------------
-- Create an offer (and, for exclusive offers, a hold on the slot).
-- Errors: ENTRY_NOT_WAITING, SLOT_UNAVAILABLE.
-- ---------------------------------------------------------------------------
create or replace function public.create_waitlist_offer(
  p_entry_id uuid,
  p_period tstzrange,
  p_token_hash text,
  p_exclusive_until timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer_id uuid;
begin
  if not public.is_valid_period(p_period) then
    raise exception using errcode = 'P0001', message = 'INVALID_PERIOD';
  end if;
  perform public.lock_calendar_range(p_period);

  -- The entry must still be waiting (not notified twice in parallel).
  perform 1 from public.waitlist_entries where id = p_entry_id and status = 'waiting' for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'ENTRY_NOT_WAITING';
  end if;

  if exists (select 1 from public.appointments a where a.period && p_period and a.status <> 'cancelled')
     or exists (select 1 from public.blocks b where b.period && p_period)
     or exists (
       select 1 from public.slot_holds h
       where h.period && p_period and h.released_at is null and h.expires_at > now()
     ) then
    raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
  end if;

  insert into public.waitlist_offers (entry_id, period, token_hash, exclusive_until, status, sent_at)
  values (p_entry_id, p_period, p_token_hash, p_exclusive_until, 'offered', now())
  returning id into v_offer_id;

  if p_exclusive_until is not null then
    insert into public.slot_holds (offer_id, period, expires_at)
    values (v_offer_id, p_period, p_exclusive_until);
  end if;

  update public.waitlist_entries set status = 'notified' where id = p_entry_id;
  return v_offer_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Close an open offer without a booking: 'expired' (no answer in time),
-- 'superseded' (declined, or the slot went to someone else).
-- The entry goes back to waiting (unless its day is over), never to be
-- offered that same start again.
-- ---------------------------------------------------------------------------
create or replace function public.release_waitlist_offer(p_offer_id uuid, p_status public.offer_status)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.waitlist_offers;
  v_day date;
begin
  if p_status not in ('expired', 'superseded') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS';
  end if;

  update public.waitlist_offers set status = p_status, responded_at = now()
  where id = p_offer_id and status = 'offered'
  returning * into v_offer;
  if v_offer.id is null then
    return null;
  end if;

  update public.slot_holds set released_at = now() where offer_id = p_offer_id and released_at is null;

  update public.waitlist_entries e
  set status = case when e.day < (now() at time zone 'Europe/Paris')::date then 'expired'::public.waitlist_status else 'waiting'::public.waitlist_status end,
      excluded_starts = array_append(e.excluded_starts, lower(v_offer.period))
  where e.id = v_offer.entry_id and e.status = 'notified'
  returning e.day into v_day;

  return v_day;
end;
$$;

-- ---------------------------------------------------------------------------
-- Book the offered slot. Errors: OFFER_UNAVAILABLE, OFFER_EXPIRED, and those
-- of create_appointment (SLOT_TAKEN, SLOT_BLOCKED, SLOT_HELD).
-- ---------------------------------------------------------------------------
create or replace function public.redeem_waitlist_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.waitlist_offers;
  v_entry public.waitlist_entries;
  v_service public.services;
  v_variant public.service_variants;
  v_appointment_id uuid;
begin
  select * into v_offer from public.waitlist_offers where id = p_offer_id for update;
  if v_offer.id is null or v_offer.status <> 'offered' then
    raise exception using errcode = 'P0001', message = 'OFFER_UNAVAILABLE';
  end if;
  if (v_offer.exclusive_until is not null and v_offer.exclusive_until <= now()) or lower(v_offer.period) <= now() then
    raise exception using errcode = 'P0001', message = 'OFFER_EXPIRED';
  end if;

  select * into v_entry from public.waitlist_entries where id = v_offer.entry_id for update;
  select * into v_service from public.services where id = v_entry.service_id;
  if v_entry.variant_id is not null then
    select * into v_variant from public.service_variants where id = v_entry.variant_id;
  end if;

  v_appointment_id := public.create_appointment(
    v_entry.client_id,
    v_entry.service_id,
    v_entry.variant_id,
    v_service.name,
    v_variant.name,
    v_entry.duration_min,
    coalesce(v_variant.price_cents, v_service.price_cents),
    lower(v_offer.period),
    'waitlist',
    null,
    null,
    v_offer.id
  );

  update public.waitlist_offers set status = 'accepted', responded_at = now() where id = v_offer.id;
  update public.waitlist_entries set status = 'booked' where id = v_entry.id;
  update public.slot_holds set released_at = now() where offer_id = v_offer.id and released_at is null;
  return v_appointment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Housekeeping, run by the scheduled job. Returns the days to re-process.
--   * exclusive offers past their window → expired (next client's turn)
--   * offers whose slot has started → expired
--   * entries whose day is over → expired
-- ---------------------------------------------------------------------------
create or replace function public.expire_waitlist()
returns setof date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer record;
  v_day date;
  v_today date := (now() at time zone 'Europe/Paris')::date;
begin
  for v_offer in
    select id from public.waitlist_offers
    where status = 'offered'
      and ((exclusive_until is not null and exclusive_until <= now()) or lower(period) <= now())
  loop
    v_day := public.release_waitlist_offer(v_offer.id, 'expired');
    if v_day is not null and v_day >= v_today then
      return next v_day;
    end if;
  end loop;

  update public.waitlist_entries set status = 'expired'
  where day < v_today and status in ('waiting', 'notified');
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.create_waitlist_offer(uuid, tstzrange, text, timestamptz)',
    'public.release_waitlist_offer(uuid, public.offer_status)',
    'public.redeem_waitlist_offer(uuid)',
    'public.expire_waitlist()'
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;
