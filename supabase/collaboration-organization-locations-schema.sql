-- Spatial Collaboration Map: organization location lookup
-- Run this in Supabase SQL Editor, then import:
-- supabase/seed/collaboration_organization_locations.csv

create table if not exists public.collaboration_organization_locations (
  organization_name text primary key,
  country text not null,
  province text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_level text not null default 'country'
    check (location_level in ('province', 'country', 'unknown')),
  updated_at timestamptz not null default now()
);

create index if not exists collaboration_locations_country_idx
  on public.collaboration_organization_locations (country);

create index if not exists collaboration_locations_province_idx
  on public.collaboration_organization_locations (province);

create index if not exists collaboration_locations_region_idx
  on public.collaboration_organization_locations (region);

alter table public.collaboration_organization_locations enable row level security;

drop policy if exists "public read collaboration_organization_locations"
  on public.collaboration_organization_locations;

create policy "public read collaboration_organization_locations"
on public.collaboration_organization_locations
for select
using (true);
