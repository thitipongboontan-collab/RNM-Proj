-- Research project map (แผนที่โครงการวิจัย)
-- Additive only. Run in Supabase SQL Editor before:
--   npm run project-map:import
-- CRS: WGS84 / EPSG:4326. Do not invent coordinates.

create table if not exists public.map_research_locations (
  location_id text primary key,
  area_name text,
  tambon text,
  amphoe text,
  province text,
  country text,
  region text,
  search_query text,
  map_data_type text,
  coordinate_status text,
  place_lookup_result text,
  coordinate_source text,
  geocoded_at timestamptz,
  map_search_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.map_research_projects (
  project_id text primary key,
  title_th text not null,
  title_en text,
  fiscal_year_be integer,
  sdg text,
  strategy text,
  research_group text,
  research_type text,
  start_year_be integer,
  end_year_be integer,
  year_count integer,
  funding_kind text,
  funding_source text,
  principal_investigator text,
  co_investigators text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.map_research_project_locations (
  project_location_id text primary key,
  project_id text not null references public.map_research_projects (project_id) on delete cascade,
  location_id text not null references public.map_research_locations (location_id) on delete cascade,
  area_name text,
  tambon text,
  amphoe text,
  province text,
  country text,
  region text,
  created_at timestamptz not null default now()
);

create index if not exists map_research_project_locations_project_idx
  on public.map_research_project_locations (project_id);
create index if not exists map_research_project_locations_location_idx
  on public.map_research_project_locations (location_id);
create index if not exists map_research_projects_fiscal_year_idx
  on public.map_research_projects (fiscal_year_be);
create index if not exists map_research_locations_province_idx
  on public.map_research_locations (province);

create table if not exists public.map_location_geometries (
  location_id text primary key references public.map_research_locations (location_id) on delete cascade,
  geometry_type text check (
    geometry_type is null
    or geometry_type in ('Point', 'Polygon', 'MultiPolygon')
  ),
  latitude double precision,
  longitude double precision,
  geojson jsonb,
  coordinate_source text,
  verification_status text not null default 'pending'
    check (
      verification_status in (
        'pending',
        'verified',
        'failed',
        'wide_area',
        'multi_area',
        'needs_split'
      )
    ),
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_location_geometries_lat_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint map_location_geometries_lng_range
    check (longitude is null or (longitude >= -180 and longitude <= 180))
);

alter table public.map_research_locations enable row level security;
alter table public.map_research_projects enable row level security;
alter table public.map_research_project_locations enable row level security;
alter table public.map_location_geometries enable row level security;

drop policy if exists "public read map_research_locations" on public.map_research_locations;
create policy "public read map_research_locations"
on public.map_research_locations for select using (true);

drop policy if exists "public read map_research_projects" on public.map_research_projects;
create policy "public read map_research_projects"
on public.map_research_projects for select using (true);

drop policy if exists "public read map_research_project_locations" on public.map_research_project_locations;
create policy "public read map_research_project_locations"
on public.map_research_project_locations for select using (true);

drop policy if exists "public read map_location_geometries" on public.map_location_geometries;
create policy "public read map_location_geometries"
on public.map_location_geometries for select using (true);

comment on table public.map_location_geometries is
  'Verified WGS84 geometries only. Point requires verified lat/lng; Area uses GeoJSON polygon. Never invent coordinates.';
