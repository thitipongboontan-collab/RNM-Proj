-- Run in Supabase SQL Editor to support admin profile photo uploads.

alter table public.researchers add column if not exists image_path text;
