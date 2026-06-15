-- Run this in Supabase SQL Editor before using Admin news CRUD.

create table if not exists public.research_news (
  news_id text primary key,
  title text not null,
  category text not null,
  published_date text not null,
  details text not null,
  image_path text,
  external_url text,
  attachment_file_name text,
  attachment_storage_path text,
  view_count integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists research_news_display_order_idx on public.research_news (display_order);

alter table public.research_news enable row level security;

drop policy if exists "public read research_news" on public.research_news;
create policy "public read research_news"
on public.research_news
for select
using (true);

-- If the table already exists, run:
-- alter table public.research_news add column if not exists image_path text;

-- Optional Storage buckets (create in Dashboard if not exists):
-- research-news-images (public)
-- research-news-documents (public)
