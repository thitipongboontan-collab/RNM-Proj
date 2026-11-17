# Phase A audit: Researcher Expertise Intelligence

Audit date: 2026-11-17  
Scope: existing Research Nexus Matching codebase before the expertise-intelligence changes.  
No production data was modified for this audit.

## Existing architecture

The platform is a Next.js app on Vercel. Researcher and funding records live in Supabase PostgreSQL. The public site reads them with the anon client. Admin writes use the service-role client after `getAdminSession()` / `requireAdminSession()` (`src/lib/admin/auth.ts`), optionally restricted by `ADMIN_EMAIL`.

AI today has two layers:

1. **Retrieval assistant** (`src/app/api/assistant/route.ts`, `src/lib/ai/pipeline.ts`). A server route calls OpenAI chat completions (`OPENAI_MODEL`, default `gpt-4o-mini`). The system prompt is `src/lib/assistant-prompt.ts`. Context is built from Supabase rows plus optional pgvector hits in `ai_documents`.
2. **Deterministic suggestion scores** (`src/lib/ai/intelligence/funding-fit.ts`, `src/lib/match-service.ts`). Funding fit and researcher fit are token-overlap scores, not a model judgment. This phase does not replace that matcher.

Embeddings are built offline by `scripts/ai/index-embeddings.mjs` into `public.ai_documents` (`supabase/ai-vector-schema.sql`, 1536-dimension `text-embedding-3-small`).

Researcher ids are text codes such as `RS001`, not UUIDs (`public.researchers.researcher_id`).

## Database fields and relationships

Defined in `supabase/researchers-schema.sql`, `supabase/researcher-projects-schema.sql`, and `supabase/researcher-collaboration-schema.sql`.

| Table | What it stores | Used as expertise today |
| --- | --- | --- |
| `researchers` | Name, department, email, phone, Scopus-style metrics | Department is shown and indexed. Metrics affect fit score. No expertise column on this row. |
| `researcher_expertise` | Ordered free-text lines (`expertise`) | Treated as the expertise list. Admin edits this by delete-and-reinsert. |
| `researcher_keywords` | `keyword_en` / `keyword_th` | English keywords become profile tags and the first three become "top topics". |
| `researcher_degrees` | `degree_level`, `degree_text` | Shown as education. Folded into search text. Not interpreted. |
| `publications` | `title`, `source_title`, `year`, `citations` | Titles are listed and dumped into search text. No abstract, keywords, or domain column exists. |
| `researcher_projects` | `project_name`, `role_label`, `project_status`, `fiscal_year_be` | Shown on the profile tab only. Not loaded into the assistant dataset, embeddings, or fit score. No description, objective, or outcome column exists. |
| `researcher_collaborations` | Organization name and country fields | Used for network answers, not expertise. |
| `ai_documents` | One concatenated text blob plus embedding per researcher | Mixes name, department, expertise, keywords, degrees, publication titles, and organizations. |

There is no table for an interpreted expertise profile, confidence, evidence, review status, or model version.

Row-level security on the researcher tables is public-read. Writes go through the service role.

## Current AI processing workflow

1. Admin or import scripts store manual expertise lines and keywords.
2. `getAssistantDataset()` loads researchers, keywords, expertise, degrees, publication titles, and collaborations. Research projects are omitted. Publication abstracts cannot be loaded because they are not stored.
3. `buildResearcherSearchText()` concatenates all of those fields into one bag of tokens.
4. `buildResearcherIntelligence()` sets `topTopics` to the first three English keywords plus the first two expertise lines. Publication titles and projects are not read. Order in the database decides "main" topics.
5. `computeFundingFit()` scores overlap between that bag and the funding text, then adds a scholarly-output boost. A single shared token can contribute. The fallback reason is "ความเกี่ยวข้องเชิงภาควิชา/คำสำคัญ" when nothing overlaps.
6. The assistant prompt tells the model to consider synonyms and interdisciplinary links, while also saying not to invent records. The model still receives undifferentiated keyword and title lists, so it can promote an isolated word into expertise.
7. Embeddings use the same concatenated blob, so vector search can retrieve a researcher from one title token or one keyword.

## How expertise is produced today

Expertise lines in `researcher_expertise` are manually entered (import plus the admin form `expertiseText`). They are not generated from publications or projects.

Keywords are a separate manual list. The suggestion layer treats the top of that list as the researcher's main topics even when publications point elsewhere.

Publications are used only as raw title strings. Projects are not used by the assistant or the fit score at all.

## Identified problems

1. **Incomplete evidence.** The model never sees abstracts, publication keywords, project descriptions, objectives, or outcomes, because those columns do not exist. It also does not see project titles during suggestion.
2. **Keyword order is treated as expertise.** `topTopics` is a slice of lists, not a reading of the body of work.
3. **One token is enough to match.** Fit scoring and embeddings do not require repeated evidence, and they do not separate a method, a place, a population, and a topic.
4. **Manual expertise and real output can disagree.** Nothing checks whether an expertise line is supported by titles or projects.
5. **No primary versus secondary distinction.** Every line is the same kind of string.
6. **No insufficient-evidence outcome.** Empty or contradictory input still produces a score and a generic reason.
7. **Duplicate titles inflate search text.** Publication rows are not collapsed before matching.
8. **No review trail.** Admin edits overwrite `researcher_expertise`. There is no AI-versus-verified split, timestamp, or model version.
9. **Prompt pressure to generalize.** Instruction 6 in `assistant-prompt.ts` asks for synonyms and interdisciplinary connections on top of an already noisy context.

## Recommended improvements

- Add an evidence-weighted expertise profile in a new table. Do not rewrite `researchers` or `researcher_expertise`.
- Build topics only from repeated or cross-source evidence. Keep a single unsupported keyword out of primary and secondary expertise.
- Separate methods, geography, and populations from topics.
- Let the model normalize labels only when it cites evidence ids that exist in the source packet. Recompute confidence on the server.
- If the evidence is too thin, store `insufficient_evidence` instead of a guessed topic.
- Show the profile on the existing researcher page, with the supporting titles and project names.
- Let an admin approve, edit, or reject. A later analysis must not replace an approved profile until the admin reviews the new result.
- Leave funding-fit scoring unchanged in this phase so current matching behavior stays stable until profiles exist and a later phase can consume them.
- When a stored profile exists, append it to the assistant's researcher context as the expertise interpretation, without removing the underlying records.

## Files to modify

- `supabase/researcher-expertise-profiles-schema.sql` (new, additive)
- `src/lib/expertise/*` (extraction, validation, persistence)
- `src/lib/researchers-repository.ts` and `src/data/researchers.ts` (read the profile)
- `src/components/researchers/ResearcherDetailPage.tsx` and a small panel component
- `src/lib/assistant-dataset.ts` and `src/lib/ai/tools/researchers.ts` (append the profile when present)
- `src/app/admin/expertise/*`, `src/lib/admin/navigation.ts`, admin researchers list link
- `src/lib/expertise/expertise-engine.test.ts` and `docs/phase-a-researcher-expertise-test-report.md`
- `.env.local.example` (note the new SQL script only)

Do not change funding crawl, funding-match scoring, or unrelated pages.
