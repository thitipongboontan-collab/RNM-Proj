-- Phase A: evidence-weighted researcher expertise profiles.
-- Additive only. Does not alter researchers, researcher_expertise, publications, or projects.
-- Run in the Supabase SQL Editor before using Admin → ความเชี่ยวชาญ.

create table if not exists public.researcher_expertise_profiles (
  researcher_id text primary key references public.researchers (researcher_id) on delete cascade,
  analysis_status text not null default 'pending'
    check (
      analysis_status in (
        'pending',
        'ai_analyzed',
        'needs_review',
        'approved',
        'rejected',
        'insufficient_evidence'
      )
    ),
  ai_profile jsonb,
  display_profile jsonb,
  display_origin text not null default 'ai' check (display_origin in ('ai', 'admin')),
  source_fingerprint text,
  model_version text,
  confidence_method text not null default 'evidence_weighted_v1',
  analyzed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists researcher_expertise_profiles_status_idx
  on public.researcher_expertise_profiles (analysis_status, analyzed_at desc);

alter table public.researcher_expertise_profiles enable row level security;

drop policy if exists "public read researcher_expertise_profiles" on public.researcher_expertise_profiles;
create policy "public read researcher_expertise_profiles"
on public.researcher_expertise_profiles
for select
using (true);

comment on table public.researcher_expertise_profiles is
  'AI and admin expertise interpretations. display_origin=admin is not replaced by a later analysis until review.';
