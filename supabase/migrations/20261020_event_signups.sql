-- Sign-ups for community events (e.g. the Treasure Trail). Run in the Supabase SQL editor or with the Supabase CLI.
-- Nothing here is readable by the public: the website's server inserts sign-ups with the service role,
-- and admins manage them through /admin/events.
create table if not exists public.event_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlist', 'cancelled')),
  name text not null,
  whatsapp text not null,
  level text not null check (level in ('new', 'some', 'experienced')),
  friends text not null default '',
  ip_hash text not null default ''
);
create index if not exists event_signups_event_status on public.event_signups (event, status, created_at);
create index if not exists event_signups_ip_created on public.event_signups (ip_hash, created_at);
alter table public.event_signups enable row level security;
revoke all on public.event_signups from anon, authenticated;
grant all on public.event_signups to service_role;
