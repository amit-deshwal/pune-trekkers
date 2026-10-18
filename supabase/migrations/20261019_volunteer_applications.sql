-- Volunteer applications from /volunteer. Run in the Supabase SQL editor or with the Supabase CLI.
-- Nothing here is readable by the public: the website's server inserts applications with the service role,
-- and admins review them through /admin/volunteers.
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'onboarded', 'declined')),
  name text not null,
  whatsapp text not null,
  email text not null default '',
  roles text[] not null,
  experience text not null,
  portfolio text not null default '',
  availability text not null default '',
  ip_hash text not null default ''
);
create index if not exists volunteer_applications_status on public.volunteer_applications (status, created_at);
create index if not exists volunteer_applications_ip_created on public.volunteer_applications (ip_hash, created_at);
alter table public.volunteer_applications enable row level security;
revoke all on public.volunteer_applications from anon, authenticated;
grant all on public.volunteer_applications to service_role;
