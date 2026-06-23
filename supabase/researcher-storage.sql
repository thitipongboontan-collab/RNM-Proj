-- Supabase Storage for researcher profile photos (admin uploads).
-- Run in Supabase SQL Editor if you see: Upload failed: Bucket not found

insert into storage.buckets (id, name, public)
values ('researcher-images', 'researcher-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public read researcher images" on storage.objects;
create policy "public read researcher images"
on storage.objects for select
using (bucket_id = 'researcher-images');

drop policy if exists "service role manage researcher images" on storage.objects;
create policy "service role manage researcher images"
on storage.objects for all
using (bucket_id = 'researcher-images')
with check (bucket_id = 'researcher-images');
