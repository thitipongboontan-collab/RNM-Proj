-- Add updated_at to researchers if the table was created before this column existed.
-- Run in Supabase SQL Editor.

alter table public.researchers
  add column if not exists updated_at timestamptz not null default now();
