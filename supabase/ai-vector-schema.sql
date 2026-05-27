-- Phase 1: pgvector foundation for Research Nexus AI
-- Run in Supabase SQL Editor before: npm run ai:index-embeddings

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

-- HNSW works well for small/medium datasets (researchers + fundings)
create index if not exists ai_documents_embedding_idx
  on public.ai_documents
  using hnsw (embedding vector_cosine_ops);

alter table public.ai_documents enable row level security;

drop policy if exists "public read ai_documents" on public.ai_documents;
create policy "public read ai_documents"
on public.ai_documents
for select
using (true);

-- Similarity search RPC (used by AI assistant + index script verification)
create or replace function public.match_ai_documents(
  query_embedding vector(1536),
  match_count int default 12,
  filter_doc_type text default null
)
returns table (
  source_id text,
  doc_type text,
  content text,
  score float
)
language sql
stable
as $$
  select
    d.source_id,
    d.doc_type,
    d.content,
    (1 - (d.embedding <=> query_embedding))::float as score
  from public.ai_documents d
  where d.embedding is not null
    and (filter_doc_type is null or d.doc_type = filter_doc_type)
  order by d.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_ai_documents(vector, int, text) to anon, authenticated, service_role;
