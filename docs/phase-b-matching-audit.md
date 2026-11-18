# Phase B audit: Funding–Expertise Matching

Audit date: 2026-11-17  
Scope: current matching workflows, funding schema, live funding completeness, and `researcher_expertise_profiles` storage.  
No production researcher or funding rows were modified for this audit.

## Matching functions already in the codebase

There is one production matching engine. Phase B adds a second, additive assessment layer. It does not replace the ranker.

| Function | File | Role | Ranking? |
| --- | --- | --- | --- |
| `computeFundingFit` | `src/lib/ai/intelligence/funding-fit.ts` | Token overlap of `researcher.searchText` vs `funding.searchText`, plus scholarly-output boost and a baseline of 20 | Yes — this is Fit Score |
| `rankFundingsForResearcher` | same | Scores every funding for one researcher and sorts by Fit Score | Yes |
| `computeResearcherFit` | same | Wraps Fit Score for the reverse direction | Yes |
| `rankResearchersForFunding` | same | Scores every researcher for one funding, drops scores below 25 | Yes |
| `findFundingFromQuery` | same | Resolves a funding from a chat message | Lookup only |
| `getResearcherMatchResult` | `src/lib/match-service.ts` | Smart Match page data | Uses Fit Score for order |
| `matchFundingTool` | `src/lib/ai/tools/match-funding.ts` | Assistant: researcher → fundings | Uses Fit Score for order |
| `matchResearchersForFundingTool` | `src/lib/ai/tools/match-researchers-for-funding.ts` | Assistant: funding → researchers | Uses Fit Score for order |
| `researcherIntelligenceTool` | `src/lib/ai/tools/intelligence.ts` | Assistant profile plus 3 funding suggestions | Uses Fit Score for order |
| `assessExpertiseFundingMatch` | `src/lib/matching/engine.ts` | Phase B: separate Relevance, Evidence Confidence, Eligibility | No — attached to existing cards / tool blocks |

Dependencies of the production ranker:

- `getAssistantDataset()` loads researchers, keywords, manual expertise, degrees, publication titles, collaborations, projects, fundings, and attachment file names.
- `buildResearcherSearchText()` concatenates those fields into one bag of tokens.
- `scoreText` / token overlap in `src/lib/ai/text-utils.ts`.
- `researchers.scholarly_output` (boost, not evidence).
- Funding `title`, `organization`, `details`, dates, and attachment file names.

Phase B additionally reads `researcher_expertise_profiles.display_profile` and quotes `fundings.details`. It never writes those tables.

## How expertise profiles are stored and retrieved

Table: `public.researcher_expertise_profiles` (`supabase/researcher-expertise-profiles-schema.sql`). Additive. Public-read RLS. Writes go through the service role in `src/lib/expertise/repository.ts`.

| Column | Role |
| --- | --- |
| `ai_profile` | Latest evidence-weighted analysis. Recomputed by `analyzeResearcherExpertise`. |
| `display_profile` | What matching and admin review may use. Copied from `ai_profile` unless the row is admin-locked. |
| `display_origin` | `ai` or `admin`. `admin` is treated as locked. |
| `analysis_status` | `pending`, `ai_analyzed`, `needs_review`, `approved`, `rejected`, `insufficient_evidence`. |

Retrieval rules used by matching (`selectProfileForMatching`):

1. Rejected rows contribute no profile.
2. Matching reads `display_profile` only. `ai_profile` is loaded so the protection rule can be tested, then discarded.
3. `verified` is true when `display_origin = admin` or `analysis_status = approved`.
4. A later analysis of an approved/admin row writes the new result to `ai_profile`, sets status to `needs_review`, and leaves `display_profile` unchanged.

Public researcher pages still render `researcher_expertise` lines through `ResearcherProfileTabs`. They do not import `getExpertiseProfile` or `ExpertiseIntelligencePanel`.

## Funding records: fields and quality

Schema (`supabase/funding-schema.sql`): `funding_id`, `funding_code`, `title`, `full_title`, `organization`, `status_label`, `published_date`, `open_date`, `close_date`, `source_url`, `details`, `image_path`, `display_order`. Attachments are file names and storage paths only.

There are **no structured columns** for applicant type, degree, faculty, nationality, host institution, budget, or thematic codes. Eligibility lives only as free text in `details`, or in unread PDFs.

Live snapshot from `npm run matching:benchmark` (2026-11-17): 26 fundings; 52 expertise profiles (`approved=5`, `ai_analyzed=23`, `insufficient_evidence=23`, `needs_review=1`).

Observed quality issues (see the live counts in `docs/phase-b-matching-benchmark.md`):

- `details` is a pasted announcement. Many วช. records share the same NRIIS submission paragraphs.
- Topic signal is usually `กลุ่มเรื่อง …` lines inside that blob.
- Several records have empty or placeholder details (`""` or `"-"`). FD007 in the import JSON is an empty details string with the actual call sitting in a PDF.
- Dates are Thai display strings, not typed timestamps.
- Attachments are not parsed, so PDF-only eligibility and topic lists are invisible to both matchers.

## Architectural issues (reported, not assumed away)

1. One token shared between a publication title and a funding paragraph is enough for a high Fit Score because of the +20 baseline and scholarly boost.
2. Fit Score reasons fall back to “ความเกี่ยวข้องเชิงภาควิชา/คำสำคัญ” when nothing overlaps.
3. Eligibility cannot be decided for most current calls from stored fields.
4. Approved profiles may have empty primary topics; matching must not fill those from `ai_profile`.
5. Website crawling / automated funding collection is out of scope for Phase B.
6. Live FD023 (master’s grant) stores the student requirement in body copy, not a labelled “คุณสมบัติ” block. The extractor now quotes `มหาบัณฑิต` / `นักศึกษา` lines so faculty records can be marked `likely_ineligible` without using research relevance.
7. Generic English tokens (`research`, `university`, `studies`) and URLs such as `research.mis.cmu.ac.th` inflated both matchers. Phase B now drops those stopwords; the old Fit Score still uses them.

## Decision for this phase

Keep `computeFundingFit` as the ranking used by Smart Match and the assistant. Add Phase B assessments next to those results. Do not disable or delete the token-overlap scorer until the benchmark in `docs/phase-b-matching-benchmark.md` has been reviewed.
