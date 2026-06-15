-- Optional Supabase Storage buckets for admin file uploads (production).
-- Run in Supabase SQL Editor, then create buckets in Dashboard if needed:
--   funding-images (public)
--   funding-documents (public)

insert into storage.buckets (id, name, public)
values
  ('funding-images', 'funding-images', true),
  ('funding-documents', 'funding-documents', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public read funding images" on storage.objects;
create policy "public read funding images"
on storage.objects for select
using (bucket_id = 'funding-images');

drop policy if exists "public read funding documents" on storage.objects;
create policy "public read funding documents"
on storage.objects for select
using (bucket_id = 'funding-documents');

drop policy if exists "service role manage funding images" on storage.objects;
create policy "service role manage funding images"
on storage.objects for all
using (bucket_id = 'funding-images')
with check (bucket_id = 'funding-images');

drop policy if exists "service role manage funding documents" on storage.objects;
create policy "service role manage funding documents"
on storage.objects for all
using (bucket_id = 'funding-documents')
with check (bucket_id = 'funding-documents');
