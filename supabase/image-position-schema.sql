-- Run this in Supabase SQL Editor to enable cover image position for fundings and news.

alter table public.fundings
  add column if not exists image_position text not null default 'center';

alter table public.research_news
  add column if not exists image_position text not null default 'center';
