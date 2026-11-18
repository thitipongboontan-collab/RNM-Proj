# Phase C Stage 1 — Funding Intelligence Audit

Date: 2026-11-18  
Scope: inspect the live Research Nexus Matching codebase, funding schema, admin workflow, PDF/AI stack, Vercel constraints, and Phase B integration points.  
Status: **audit only**. No crawler, schema, cron, or admin UI was implemented in this stage.

This document is the Stage 1 deliverable. Stage 2 architecture is in `docs/phase-c-funding-intelligence-architecture.md`. Do not apply SQL or deploy until those proposals are reviewed.

---

## 1. What already exists and must stay

| Component | Location | Role in Phase C |
| --- | --- | --- |
| Published funding store | `public.fundings`, `public.funding_attachments` | **Only** public funding database. New approved records insert here. Never create a second live funding table. |
| Manual funding admin | `/admin/fundings`, `src/lib/admin/funding-admin.ts`, `src/app/admin/fundings/actions.ts` | Keep fully functional. Phase C approval should reuse `generateNextFundingId` (`FD###`) and cache revalidation, not replace this UI. |
| Public funding pages | `/funding`, `/funding/[id]` | Unchanged unless a newly approved row appears in `fundings`. |
| Phase A expertise | `researcher_expertise_profiles` | Do not modify rows, analysis status, or admin-lock behaviour. |
| Phase B matching | `src/lib/matching/*`, `src/lib/match-service.ts` | Do not replace `computeFundingFit`. Do not change ranker weights without a new benchmark. |
| Assistant tools | `match_funding`, `match_researchers_for_funding`, `src/app/api/assistant/route.ts` | Read published `fundings` only. No second chatbot. |
| Admin auth | `requireAdminSession`, middleware `/admin/:path*`, `ADMIN_EMAIL` | Reuse. New Phase C admin routes sit under `/admin`. |
| OpenAI JSON extraction pattern | `src/lib/expertise/ai-extract.ts` | Reuse the same server-side `OPENAI_API_KEY` + `response_format: json_object` + “do not invent” contract. |
| PDF text (assistant only) | `src/lib/assistant-document-parser.ts` + `pdf-parse` | Exists, but is **not** Phase C-ready (no pages, no OCR flag, 12k cap, user-upload only). |

Live inventory at audit time: **26** `fundings` rows (`FD001`–`FD026`), **20** attachments (16 PDF, 4 DOC), **1** row with empty details (`FD007`). Most `source_url` values already point at NRIIS.

---

## 2. Existing funding schema (the publish target)

From `supabase/funding-schema.sql`:

```text
fundings
  funding_id text PK          -- FD001 …
  funding_code text unique
  title, full_title, organization  -- required
  status_label                     -- display string, not an enum
  published_date, open_date, close_date  -- Thai display text, not date
  source_url                       -- optional
  details                          -- required free text (matching reads this)
  image_path, display_order
  created_at

funding_attachments
  id, funding_id FK, file_name, file_type in (pdf, doc), storage_path, file_order
```

RLS: public `SELECT` on both tables. Writes go through the service-role client in `src/lib/supabase/server-admin.ts`.

Storage: `funding-images` and `funding-documents` are **public** buckets (`supabase/funding-storage.sql`).

### Implications for Phase C

1. There are **no** structured columns for eligibility, topics, amount, currency, duration, applicant types, evidence quotes, or extraction confidence.
2. Dates are human Thai strings (`เปิดรับ 1 พ.ย. 2568`). Matching and the public UI expect that format. Do not switch `fundings` to ISO dates without a migration of all 26 rows and UI parsers.
3. `details` is the matching corpus today (`extractEligibilityRequirements`, `extractTopicLines`, `isSparseCallDetails`). Sparse/empty details already produce `insufficient_call_data` (B.1).
4. Attachments are stored and linked, but **never parsed** for matching or the assistant corpus (assistant dataset loads attachment **file names** only).
5. Adding 40 NOT NULL columns to `fundings` would break existing rows. Any schema change on this table must be nullable and additive, or (preferred) a sidecar table.

---

## 3. Existing admin workflow

- Nav (`src/lib/admin/navigation.ts`): ภาพรวม / สถิติ / แหล่งทุน / ข่าวสาร / นักวิจัย / ความเชี่ยวชาญ. No funding-intelligence or funding-sources item.
- Create funding requires title, organization, published/open/close dates, and details (`src/app/admin/fundings/actions.ts`).
- IDs: `generateNextFundingId()` takes the lexicographic max `funding_id` and increments (`FD026` → `FD027`).
- Cache: `revalidateFundingCaches()` tags `funding-summaries` and `fundings-full`, paths `/funding` and `/admin/fundings`. Assistant dataset uses a separate tag (`assistant-dataset`) that funding writes do **not** currently revalidate.
- Expertise review (`/admin/expertise`) is the closest UX pattern: pending → AI analyzed → admin approve/reject, and approved/admin-locked rows are not overwritten. Phase C review should copy this contract, not the expertise schema.

---

## 4. PDF and document stack

| Capability | Present? | Notes |
| --- | --- | --- |
| `pdf-parse` | Yes | Concatenated text, `numpages`, no per-page text. |
| DOCX / DOC | Yes (`mammoth`, `word-extractor`) | Assistant uploads only. |
| Page-number preservation | No | Required by Phase C evidence. |
| Fetch PDF by URL | No | Assistant parses base64 uploads. |
| Size / type limits for crawl | No | Need new limits. |
| Scanned-PDF / OCR detection | Partial | Empty extract throws; no `needs_ocr` flag. |
| OCR engine | No | Not in `package.json`. Heavy for Vercel serverless. |
| Thai encoding handling | Untested at crawl scale | `pdf-parse` is best-effort on embedded fonts. |
| Dedup by content hash | No | |

Recommendation from this audit: reuse `pdf-parse` for a first text pass, add a page-aware extractor for evidence locations, and **do not ship OCR in the first implementation** unless a separate job runtime is approved. Scanned files should be stored, flagged `needs_ocr`, and left for admin/manual handling.

---

## 5. AI extraction stack

- Server-only `OPENAI_API_KEY`. Default model `gpt-4o-mini`. Optional `OPENAI_MODEL`.
- Phase A already uses JSON mode, temperature 0, and “do not invent / evidence ids only”.
- There is **no** funding extraction schema, prompt, or validator.
- There is **no** HTML parser library (`cheerio` / `linkedom` not installed).
- There is **no** outbound fetch except OpenAI, tile maps, and admin signed uploads. No SSRF guard exists because nothing crawls today.

Phase C extraction should be a new module (`src/lib/funding-intelligence/`) that copies the Phase A contract (structured JSON, nulls, evidence quotes, never auto-publish) and does not share tables with expertise.

---

## 6. Matching and assistant integration points

Phase B reads:

- `fundings.title` + `fundings.details` (and title-only cap when details are sparse).
- Researcher display/approved expertise from Phase A.
- Regex over `details` for eligibility quotes (`src/lib/matching/eligibility.ts`, `funding-text.ts`).

`computeFundingFit` in `src/lib/ai/intelligence/funding-fit.ts` is still the production Smart Match **sort**. Phase B cards are explanations only.

Safe Phase C integration (after review):

- When an approved sidecar profile exists, prefer its **quoted** eligibility / topic / method / population fields as extra inputs to the existing extractors.
- Do not change scoring weights, Fit Score, or `computeFundingFit`.
- Only rows that exist in `public.fundings` enter `match_funding` / `match_researchers_for_funding` / the assistant dataset.
- Revalidate `assistant-dataset` when a Phase C record is approved so the assistant sees it.

Unsafe (out of scope until a separate benchmark): swapping rankers, hard-filtering `likely_ineligible` in production sort, inferring eligibility from research topics.

---

## 7. Deployment and scheduling constraints

- Next.js 15 App Router, Vercel. **No** `vercel.json`, **no** `maxDuration`, **no** cron config, **no** persistent worker.
- Server Actions `bodySizeLimit` is 50mb (`next.config.ts`) for admin uploads, not for crawl responses.
- Vercel Cron is the compatible scheduler: a secret-protected route, one short job per invocation, remaining work persisted in Postgres.
- Hobby cron jobs are short (typically 10–60s). Pro allows longer `maxDuration`. The crawler **must** be chunked: one source, or one announcement, per run.
- Service-role key and OpenAI key stay server-side. Cron auth must use a new `CRON_SECRET`, never a client-visible key.

---

## 8. Security baseline (what is missing)

Present:

- Admin cookie session + `ADMIN_EMAIL` allowlist.
- Middleware on `/admin/:path*`.
- Service-role writes only from server modules.
- Public read of published fundings (intentional).

Missing for Phase C:

- URL allowlist / SSRF protection (localhost, RFC1918, link-local, cloud metadata).
- Redirect destination validation.
- `robots.txt` handling.
- Response size and content-type limits for fetch.
- Private storage for **unreviewed** source documents (current funding buckets are public).
- Rate limiting / per-source politeness delay.
- Crawl audit log.
- Idempotent job lock.
- Cron secret.

Crawling private, authenticated, CAPTCHA, or paywalled pages is out of scope by product rule, not only by missing code.

---

## 9. Gaps mapped to the seven modules

| Module | Gap |
| --- | --- |
| 1. Source manager | No table, no `/admin/funding-sources`, no adapter config. |
| 2. Website monitoring | No fetcher, no HTML extraction, no change detection, no robots/SSRF. |
| 3. PDF intelligence | Parser exists only for assistant uploads; no URL download, pages, hash, OCR flag, private store. |
| 4. AI extraction | No funding JSON schema, evidence map, or “do not publish” pipeline. |
| 5. Validation / duplicates | No title/URL/agency duplicate checks against the existing 26 rows. High risk: NRIIS URLs already on `fundings.source_url`. |
| 6. Admin review | No queue. Expertise review is the UX template only. |
| 7. Scheduled monitoring | No cron, no job lock, no retry queue. |

---

## 10. Highest-risk findings

1. **Duplicate of live data.** Crawling NRIIS/NRCT without matching `source_url` / normalised title will recreate FD001–FD026.
2. **Silent overwrite.** If approval wrote into `fundings` on every crawl, existing editorial `details` (and FD007 once filled) would be destroyed. Approved rows must be write-protected; source changes become review proposals.
3. **Public document leak.** Putting unreviewed crawled PDFs in `funding-documents` would publish them immediately.
4. **JS-heavy agency sites.** NRIIS (`nriis.go.th`) is not a static HTML listing. A generic crawler will miss or mis-parse announcements. Source adapters and “no uncontrolled recursion” are mandatory.
5. **Vercel timeouts.** Full-site crawl + PDF download + OpenAI in one request will fail. Jobs must be staged in the database.
6. **OCR on serverless.** Tesseract or similar is not operationally realistic on the current Vercel setup. Flag scanned PDFs; do not block the rest of the pipeline.
7. **Date/currency mismatch.** Extracted ISO dates and numeric amounts cannot be dropped raw into `open_date` / `close_date` / `details` without a mapping layer to Thai display strings.
8. **Assistant cache.** Approving into `fundings` without `revalidateTag("assistant-dataset")` would leave the assistant on stale funding text.

---

## 11. What this audit recommends *not* doing

- Do not alter `researcher_expertise_profiles` or approved/admin-locked expertise.
- Do not replace `computeFundingFit` or Phase B scoring.
- Do not add a second public `fundings`-like table.
- Do not crawl unregistered URLs or follow arbitrary links.
- Do not auto-publish AI output.
- Do not put crawled blobs in the public `funding-documents` bucket before approval.
- Do not implement OCR in Stage 3 unless a runtime is explicitly approved.
- Do not deploy automatically.

---

## 12. Suggested implementation order (after architecture review)

This is planning only, not work started.

1. Additive SQL + private storage + RLS (no change to existing `fundings` rows).
2. Source manager admin UI.
3. Controlled fetch + SSRF + robots + listing/detail adapters (fixtures first).
4. PDF download, hash, page text, scanned detection.
5. AI structured extraction + validators + duplicate detection against **existing** `fundings`.
6. Review queue, approve/reject/re-extract, version proposals.
7. Map approved records into `fundings` + sidecar structured profile; revalidate funding **and** assistant caches.
8. Cron endpoint + job lock + manual “crawl now”.
9. Tests listed in the architecture doc.
10. Optional later: OCR, named NRIIS adapter if the site remains JS-only, matching-weight benchmark.

A high-value precursor that does not require crawling: extract text from the **20 existing** `funding_attachments` and fill sparse `details` (especially FD007) under admin review. That is local parsing, already recommended in `docs/phase-b1-phase-c-recommendations.md`, and would improve Phase B immediately.

---

## 13. Review gate

Stage 3 must not start until the architecture in `docs/phase-c-funding-intelligence-architecture.md` is accepted, in particular:

- Sidecar structured profile vs columns on `fundings`.
- Private bucket for unreviewed documents.
- OCR deferred.
- Vercel cron chunking model.
- Duplicate handling against FD001–FD026.
- Matching reads sidecar quotes but does not change the ranker.
