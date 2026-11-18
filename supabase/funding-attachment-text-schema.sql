-- Additive: store text extracted from admin-uploaded PDF/DOC attachments.
-- Run in the Supabase SQL editor. Does not change existing fundings rows.
-- Public PDFs remain in funding-documents; this only caches extracted text for matching.

alter table public.funding_attachments
  add column if not exists extracted_text text,
  add column if not exists extraction_status text not null default 'pending',
  add column if not exists text_origin text,
  add column if not exists page_count integer,
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_error text;

comment on column public.funding_attachments.extracted_text is
  'Plain text from the attachment (page markers [[page n]]). Used by matching and the AI Assistant. Never invents content.';
comment on column public.funding_attachments.extraction_status is
  'pending | extracted | needs_ocr | malformed | too_large | unsupported';
comment on column public.funding_attachments.text_origin is
  'embedded | none — OCR is not applied in this release.';

create index if not exists funding_attachments_extraction_status_idx
  on public.funding_attachments (extraction_status);
