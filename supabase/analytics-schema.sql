-- Phase 4A analytics: view counts for fundings/researchers and site page views.
-- Run in Supabase SQL Editor.

alter table public.fundings add column if not exists view_count integer not null default 0;
alter table public.researchers add column if not exists view_count integer not null default 0;

create table if not exists public.site_page_views (
  page_key text primary key,
  view_count integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_page_views (page_key, view_count)
values
  ('home', 0),
  ('funding', 0),
  ('researchers', 0),
  ('spatial', 0),
  ('works', 0)
on conflict (page_key) do nothing;

alter table public.site_page_views enable row level security;

drop policy if exists "public read site_page_views" on public.site_page_views;
create policy "public read site_page_views"
on public.site_page_views
for select
using (true);
