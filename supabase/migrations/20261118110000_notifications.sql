-- Notifications: owner settings, at-most-once delivery, scheduled jobs.

-- ---------------------------------------------------------------------------
-- Private studio settings (admin only). business_settings is publicly
-- readable, so the address where Alessia receives notifications lives here.
-- ---------------------------------------------------------------------------
create table public.studio_private_settings (
  id boolean primary key default true check (id),
  notification_email extensions.citext
    check (notification_email is null or notification_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notify_owner_on_booking boolean not null default true,
  notify_owner_on_cancellation boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.studio_private_settings enable row level security;
create policy admin_all on public.studio_private_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger set_updated_at before update on public.studio_private_settings
  for each row execute function public.set_updated_at();
insert into public.studio_private_settings (id) values (true) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Delivery log extras
-- ---------------------------------------------------------------------------
alter table public.notification_log
  add column subject text,
  add column attempts integer not null default 0,
  add column last_attempt_at timestamptz;

create index notification_log_status_idx on public.notification_log (status, created_at desc);

-- Claims the right to send one notification. Returns the log row id when the
-- caller must send it, or NULL when it was already sent / is being sent /
-- gave up. A retry is only allowed after an explicit provider failure
-- ('failed'), never for an uncertain outcome ('queued'): at most once.
create or replace function public.claim_notification(
  p_key text,
  p_kind text,
  p_channel text,
  p_recipient text,
  p_appointment_id uuid default null,
  p_offer_id uuid default null,
  p_max_attempts integer default 3
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.notification_log
    (kind, channel, recipient, appointment_id, offer_id, idempotency_key, status, attempts, last_attempt_at)
  values
    (p_kind, p_channel, p_recipient, p_appointment_id, p_offer_id, p_key, 'queued', 1, now())
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is not null then
    return v_id;
  end if;

  update public.notification_log
  set status = 'queued', attempts = attempts + 1, last_attempt_at = now(), error = null
  where idempotency_key = p_key and status = 'failed' and attempts < p_max_attempts
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.claim_notification(text, text, text, text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_notification(text, text, text, text, uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Scheduled jobs (Supabase pg_cron + pg_net): every 5 minutes, POST to the
-- site's /api/cron/taches with the shared secret stored in Supabase Vault.
-- Run once per environment (see README):
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
--   select public.schedule_studio_jobs('https://<domain>');
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.schedule_studio_jobs(p_site_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_site_url !~ '^https?://[^/]+$' then
    raise exception 'Expected a base URL like https://example.com, got %', p_site_url;
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'lady-a-beauty-taches';

  perform cron.schedule(
    'lady-a-beauty-taches',
    '*/5 * * * *',
    format(
      $cmd$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 25000
        );
      $cmd$,
      p_site_url || '/api/cron/taches'
    )
  );
end;
$$;

revoke all on function public.schedule_studio_jobs(text) from public, anon, authenticated;
