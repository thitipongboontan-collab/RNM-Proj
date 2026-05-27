-- Phase 1: pgvector foundation for Research Nexus AI
-- Run in Supabase SQL Editor when ready to persist embeddings.

create extension if not exists vector;

create table if not exists public.ai_documents (
  id text primary key,
  doc_type text not null check (doc_type in ('researcher', 'funding', 'publication')),
  source_id text not null,
  chunk_key text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

create unique index if not exists ai_documents_chunk_unique_idx
  on public.ai_documents (doc_type, source_id, chunk_key);

create index if not exists ai_documents_source_idx
  on public.ai_documents (doc_type, source_id);

create index if not exists ai_documents_embedding_idx
  on public.ai_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.ai_documents enable row level security;

drop policy if exists "public read ai_documents" on public.ai_documents;
create policy "public read ai_documents"
on public.ai_documents
for select
using (true);

-- Example similarity query:
-- select source_id, content, 1 - (embedding <=> :query_embedding) as score
-- from public.ai_documents
-- where doc_type = 'researcher'
-- order by embedding <=> :query_embedding
-- limit 12;
