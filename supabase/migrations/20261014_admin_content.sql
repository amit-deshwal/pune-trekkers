-- Run this migration in the Supabase SQL editor or with the Supabase CLI.
-- The website receives only public_site_content. Raw drafts, including unconsented images, stay private.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_content (
  id text primary key check (id = 'main'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.public_site_content (
  id text primary key check (id = 'main'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.public_site_content enable row level security;

create or replace function public.is_site_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid())
$$;
grant execute on function public.is_site_admin() to anon, authenticated;

drop policy if exists "admins can see themselves" on public.admin_users;
create policy "admins can see themselves" on public.admin_users for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "public can read published website content" on public.public_site_content;
create policy "public can read published website content" on public.public_site_content for select to anon, authenticated using (true);

-- Keep the raw table server-only. The service role used by /api/admin/treks bypasses RLS.
revoke all on public.site_content from anon, authenticated;
grant select on public.public_site_content to anon, authenticated;
-- Explicit grants so this works when "Automatically expose new tables" is disabled.
grant select on public.admin_users to authenticated;
grant all on public.admin_users, public.site_content, public.public_site_content to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('trip-uploads','trip-uploads',false,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
drop policy if exists "site admins upload trek images" on storage.objects;
create policy "site admins upload trek images" on storage.objects for insert to authenticated with check (bucket_id='trip-uploads' and public.is_site_admin());
drop policy if exists "site admins manage trek images" on storage.objects;
create policy "site admins manage trek images" on storage.objects for all to authenticated using (bucket_id='trip-uploads' and public.is_site_admin()) with check (bucket_id='trip-uploads' and public.is_site_admin());

-- After creating the first Supabase Auth user, make that account an admin:
-- insert into public.admin_users (user_id) values ('AUTH_USER_UUID_HERE');
