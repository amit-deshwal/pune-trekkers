-- Member-submitted hike plans. Run in the Supabase SQL editor or with the Supabase CLI.
-- Nothing here is readable by the public: the website's server uses the service role to list approved plans
-- (without the WhatsApp number) and to open a chat, and admins approve plans through /admin/plans.
create table if not exists public.member_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  name text not null,
  whatsapp text not null,
  destination text not null,
  date date not null,
  start_time text not null default '',
  meeting_point text not null default '',
  difficulty text not null check (difficulty in ('Easy', 'Moderate', 'Challenging')),
  max_people integer check (max_people is null or max_people between 1 and 30),
  summary text not null,
  ip_hash text not null default ''
);
create index if not exists member_plans_status_date on public.member_plans (status, date);
create index if not exists member_plans_ip_created on public.member_plans (ip_hash, created_at);
alter table public.member_plans enable row level security;
revoke all on public.member_plans from anon, authenticated;
grant all on public.member_plans to service_role;
