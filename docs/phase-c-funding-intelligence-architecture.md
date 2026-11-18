# Phase C Stage 2 — Funding Intelligence Architecture (proposal)

Status: **proposal for review**. Do not run SQL, add dependencies, or ship admin UI until this document is accepted.

Companion: `docs/phase-c-funding-intelligence-audit.md`.

Governing rule: **AI collects and structures information; the source document remains the authority; administrators approve before anything enters `public.fundings`.**

---

## 1. How new data relates to existing funding

```
Registered funding_sources
        │
        ▼
Crawl job (allowlisted URL only)
        │
        ├─ HTML announcement pages
        └─ PDF/DOC attachments (private bucket)
                │
                ▼
        Extraction run (OpenAI JSON + validators)
                │
                ▼
        funding_review_items   ← admin edits, reject, re-extract, mark duplicate
                │
                │  approve
                ▼
        public.fundings  +  funding_attachments     (existing publish store)
        funding_extracted_profiles                  (sidecar structured fields)
                │
                ▼
        Phase B matching + AI Assistant (only published rows)
```

- `public.fundings` remains the **only** record that Smart Match, `/funding`, and the assistant load.
- Pipeline tables are **not** a second funding database. They hold candidates, evidence, and history.
- Existing `FD001`–`FD026` stay as they are. A crawl that matches them becomes a **possible duplicate**, never an automatic update.
- After approval of a *new* opportunity, insert via the existing ID generator (`FD027`…).
- After a *material change* to an already approved Phase C record, insert a `funding_version_proposals` row. Do not overwrite `fundings` until an admin accepts the proposal.

This mirrors Phase A: `researcher_expertise_profiles` never overwrites the hand-entered expertise tables, and approved/locked rows are not silently replaced.

---

## 2. Proposed additive schema

All tables in `public`, created by a new file `supabase/funding-intelligence-schema.sql`. No `DROP`. No rewrite of `fundings`.

### 2.1 `funding_sources`

Admin-managed allowlist. The crawler may fetch **only** these origins (and same-host paths permitted by the source’s strategy).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `name` | text | Display name |
| `organization` | text | |
| `country` | text | ISO or Thai label |
| `website_url` | text | Canonical origin; validated http(s) |
| `listing_url` | text | Page to fetch (may equal website_url) |
| `source_type` | text | `government` `university` `research_institute` `international_org` `foundation` `collaboration_program` `grant_program` `other` |
| `language` | text | `th` `en` `th-en` |
| `adapter_key` | text | `generic_html` or a named adapter |
| `extraction_config` | jsonb | CSS selectors, link patterns, PDF patterns; empty for named adapters |
| `monitoring_frequency` | text | `manual` `daily` `every_6h` `weekly` |
| `is_active` | boolean | Inactive sources are never crawled |
| `robots_txt_status` | text | `unknown` `allowed` `disallowed` `missing` |
| `min_request_interval_ms` | int | Politeness |
| `last_checked_at` | timestamptz | |
| `last_success_at` | timestamptz | |
| `last_status` | text | `idle` `running` `success` `partial` `failed` `blocked` |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | |
| `created_by` | text | Admin email |

Unique: `(website_url, listing_url)`.

### 2.2 `funding_source_announcements`

Discovered pages. Not published funding.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `source_id` | uuid FK → funding_sources | |
| `canonical_url` | text | Dedup key with source_id |
| `title` | text | From listing/detail HTML |
| `snippet` | text | |
| `published_at_raw` | text | As seen on the page |
| `content_hash` | text | SHA-256 of normalised HTML/text |
| `http_status` | int | |
| `discovery_status` | text | `new` `unchanged` `changed` `removed` `ignored` |
| `first_seen_at` / `last_seen_at` | timestamptz | |
| `last_content_hash` | text | Previous hash for change detection |

Unique: `(source_id, canonical_url)`.

### 2.3 `funding_source_documents`

PDFs/DOCX discovered from an announcement.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `announcement_id` | uuid FK | |
| `source_url` | text | Original file URL |
| `content_sha256` | text | Idempotent skip |
| `mime_type` | text | |
| `byte_size` | int | |
| `storage_bucket` | text | `funding-intelligence-docs` (private) |
| `storage_path` | text | |
| `page_count` | int | |
| `extraction_status` | text | `pending` `extracted` `needs_ocr` `encrypted` `malformed` `too_large` `unsupported` |
| `text_origin` | text | `embedded` `ocr` `none` |
| `extracted_text` | text | Page-delimited (see §4) |
| `needs_ocr` | boolean | |
| `error_message` | text | |

Unique: `content_sha256` (same PDF from two URLs is one document; provenance stays on announcement + source_url history in jsonb if needed).

### 2.4 `funding_source_crawl_logs`

Audit/debug. One row per job attempt.

| Column | Type |
| --- | --- |
| `id` uuid PK, `source_id` uuid FK, `job_id` uuid |
| `trigger` text (`cron` `manual` `retry`) |
| `started_at` / `finished_at` timestamptz |
| `status` text |
| `pages_fetched` int, `documents_fetched` int, `announcements_new` int, `announcements_changed` int |
| `http_errors` jsonb, `message` text |

### 2.5 `funding_extraction_runs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `announcement_id` | uuid FK | |
| `model` | text | |
| `prompt_version` | text | |
| `input_excerpt` | text | Truncated source sent to the model |
| `raw_response` | jsonb | |
| `parsed_payload` | jsonb | Schema-validated or null |
| `validation_warnings` | jsonb | |
| `overall_confidence` | numeric | 0–1, not a probability of award |
| `status` | text | `pending` `succeeded` `invalid_json` `failed` |
| `created_at` | timestamptz | |

### 2.6 `funding_review_items`

Admin queue. One active item per announcement (new run updates the same item unless approved).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `announcement_id` | uuid FK | |
| `latest_run_id` | uuid FK | |
| `status` | text | `pending_review` `needs_reextract` `approved` `rejected` `duplicate` `ignored` |
| `edited_payload` | jsonb | Admin corrections |
| `possible_duplicate_funding_ids` | text[] | Existing `FD###` |
| `possible_duplicate_review_ids` | uuid[] | Other queue items |
| `reviewer_email` | text | |
| `reviewed_at` | timestamptz | |
| `rejection_reason` | text | |
| `published_funding_id` | text FK → fundings | Null until approved |
| `created_at` / `updated_at` | timestamptz | |

Approved items are immutable except via `funding_version_proposals`.

### 2.7 `funding_extracted_profiles` (sidecar)

Structured fields for matching **after** approval. Keyed by `funding_id`. Same idea as `researcher_expertise_profiles`.

Contains the Module 4 field groups (general, research, eligibility, financial, timeline, application, source) as jsonb plus:

- `evidence` jsonb — per-field `{ value, quote, locator, explicit }`
- `ai_inferred_fields` text[] — keywords/domains that must not be treated as verified facts
- `extraction_run_id`, `approved_at`, `approved_by`
- `admin_locked` boolean — if true, even accepted version proposals cannot auto-apply; admin must unlock

Do **not** put these columns on `fundings`. The public table stays display-oriented.

### 2.8 `funding_version_proposals`

When `content_hash` changes on an announcement that already has `published_funding_id`:

- Store old hash, new hash, diff of extracted fields, material-change flags (deadline, amount, eligibility).
- Status `pending` until admin apply/dismiss.
- Apply copies into `fundings` + sidecar and writes an audit row. Never a silent update.

### 2.9 `funding_job_locks`

| Column | Type |
| --- | --- |
| `lock_key` text PK | e.g. `cron:funding-monitor` or `source:{id}` |
| `holder` text | invocation id |
| `expires_at` timestamptz | |

Prevents overlapping cron runs.

### 2.10 Indexes

- `funding_sources (is_active, last_checked_at)`
- `funding_source_announcements (source_id, discovery_status)`
- `funding_source_announcements (canonical_url)`
- `funding_source_documents (content_sha256)`
- `funding_review_items (status, created_at)`
- `funding_extracted_profiles (funding_id)` unique
- Duplicate helpers: gin/trigram optional later; v1 uses normalised title + exact URLs in application code

### 2.11 RLS

| Table | SELECT | WRITE |
| --- | --- | --- |
| All pipeline tables | authenticated admin email **or** deny all and use service role only | service role only |
| `funding_extracted_profiles` | public SELECT of **non-sensitive** subset is optional; default **no public read**. Matching runs server-side with service role / server client. | service role |
| `fundings` | unchanged public SELECT | unchanged service role |

Prefer: pipeline tables have RLS enabled, no anon policies, service-role bypass for server jobs. Admin UI uses existing `getAdminClient()`.

### 2.12 Storage

New private bucket `funding-intelligence-docs`:

- No public SELECT policy.
- Service role upload/read.
- Admin review pages stream via a signed URL issued by a server action (short TTL).
- After approval, **optionally** copy a redacted/public PDF into existing `funding-documents` if the admin ticks “attach to public funding record”. Default: do not auto-publish source PDFs.

---

## 3. Mapping approved extraction → existing `fundings`

| Extracted field | Destination |
| --- | --- |
| `funding_title` | `fundings.title` |
| `funding_title_original` or title | `fundings.full_title` |
| `funding_agency` | `fundings.organization` |
| `funding_description` + quoted eligibility/financial blocks | `fundings.details` (composed, still human-readable Thai/English) |
| `opening_date` / `application_deadline` / `announcement_date` | Thai display strings via existing `thai-date` helpers → `open_date` / `close_date` / `published_date` |
| `application_url` or `source_url` | `fundings.source_url` |
| default | `status_label` = `ทุนวิจัยที่เปิดรับ` unless deadline passed → keep current wording conventions |
| structured fields + evidence | `funding_extracted_profiles` |
| approved public files (opt-in) | `funding_attachments` |

Required today for insert: title, organization, three date strings, details. If extraction is missing a date, admin must fill it in the review form; the approve action must not invent dates.

Expired deadline: queue item can be approved as historical, but default status warning is shown. Do not auto-reject.

---

## 4. Processing architecture

### 4.1 Fetch / SSRF

Server-only module `src/lib/funding-intelligence/fetch.ts`:

1. Scheme `https:` preferred; `http:` allowed only if the registered source says so.
2. Reject `localhost`, `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`, cloud metadata hosts.
3. Resolve DNS; reject if any address is private (DNS rebinding).
4. Host must match the registered source origin (or an explicit extra-host list on the source, still public).
5. Max redirects: 3, each destination re-validated.
6. Timeouts: 15s HTML, 30s PDF.
7. Max body: 2 MB HTML, 15 MB PDF.
8. Allowed types: `text/html`, `application/xhtml+xml`, `application/pdf`, `application/msword`, OOXML word.
9. User-Agent identifies the project; respect `robots.txt` (cache 24h). If disallowed, log `blocked` and stop.
10. Retries: 2, exponential backoff, only on 429/5xx/timeout.
11. No cookies, no auth headers, no CAPTCHA bypass.

### 4.2 Adapters

```ts
interface SourceAdapter {
  listAnnouncements(html: string, baseUrl: string): ListedAnnouncement[];
  parseDetail?(html: string, url: string): DetailPage;
  discoverDocuments(html: string, baseUrl: string): DocumentLink[];
}
```

- `generic_html` uses `extraction_config` selectors. If selectors miss, store the listing fetch as failed-partial rather than spidering the whole site.
- Named adapters (later): `nriis`, `nrct`, `cmu_research` — only if generic_html is proven insufficient.
- Depth is fixed: listing → optional one detail page → document URLs on that page. **No recursive crawl.**

HTML parser: add `linkedom` or `cheerio` (small, Node-compatible). Not Playwright/Puppeteer on Vercel.

### 4.3 PDF pipeline

1. Skip if `content_sha256` already extracted with status `extracted` or `needs_ocr`.
2. `pdf-parse` for a full-text pass (compatibility with current stack).
3. Page-aware pass (pdf.js / `unpdf`) to store text as:

   ```
   [[page 1]]
   ...
   [[page 2]]
   ...
   ```

4. If total letters / page_count below threshold **or** extract empty → `needs_ocr = true`, `text_origin = none`. Do not call OpenAI on empty OCR-less scans except to mark the review item “insufficient source text”.
5. Encrypted / malformed → status flags, no throw to the cron.
6. **OCR v1: out of scope** on Vercel. Document as a known limitation. Optional later: Cloud Vision / separate worker.

### 4.4 AI extraction

New `src/lib/funding-intelligence/extract.ts`, modelled on `expertise/ai-extract.ts`:

- Model: `OPENAI_MODEL` or `gpt-4o-mini`.
- Temperature 0, `response_format: json_object`.
- Prompt rules from the Phase C spec (nulls, no invention, quotes, locators, inferred keywords listed separately).
- Zod or hand-written schema validation; invalid JSON → `invalid_json`, admin can re-extract.
- Evidence object required for: title, agency, eligibility, deadlines, amounts. Missing evidence → field set null even if the model filled it.
- `research_keywords` / inferred domains always go to `ai_inferred_fields` and are **not** copied into `fundings.details` as facts.

### 4.5 Validation and duplicates

Run before the review item is marked `pending_review`:

- Required: title or title_original; agency; at least one of source_url / document url.
- Dates: parseable or raw-preserved; `application_deadline` before `opening_date` is a warning.
- Currency: ISO 4217 or `THB`/`USD`/`EUR`; else null + warning.
- Expired deadline: warning, not a hard fail.
- Contradictions: two different deadlines/amounts in quotes → warning.
- Duplicates (flag, do not merge):
  1. Exact `canonical_url` or `application_url` vs `fundings.source_url` and other announcements.
  2. Normalised title + normalised agency vs `fundings.title` / `organization`.
  3. Same `content_sha256` document already linked to a published funding.

Low-confidence duplicates stay in queue with `possible_duplicate_funding_ids`.

### 4.6 Jobs and Vercel

```
GET/POST /api/cron/funding-monitor
Authorization: Bearer CRON_SECRET
maxDuration: 60 (document Pro override 300)
```

Each invocation:

1. Acquire `funding_job_locks.cron:funding-monitor` (skip if held).
2. Pick one due active source (`last_checked_at` older than frequency, or never checked).
3. Fetch listing (one HTTP) → upsert announcements.
4. Enqueue up to N detail/PDF/extract steps as `funding_job_queue` rows (lightweight table or reuse crawl_logs + announcement status).
5. If time remains, process **one** queued unit (detail fetch **or** one PDF **or** one extraction).
6. Release lock.

Manual “crawl now” from `/admin/funding-sources` is the same worker with `trigger=manual`, still one source.

`vercel.json` (when approved):

```json
{
  "crons": [{ "path": "/api/cron/funding-monitor", "schedule": "0 */6 * * *" }]
}
```

Frequency per source still honoured in SQL; cron is only the wake-up.

---

## 5. Admin UI (existing design system)

Reuse `AdminHeader`, dashboard layout, Tailwind tokens, `requireAdminSession`.

| Route | Purpose |
| --- | --- |
| `/admin/funding-sources` | List/add/edit/disable sources, last status, “crawl now”, crawl history |
| `/admin/funding-sources/[id]` | Source detail, announcements, logs |
| `/admin/funding-intelligence` | Review queue: pending count, confidence, warnings, deadline, duplicates |
| `/admin/funding-intelligence/[id]` | Original text, PDFs (signed), extracted fields, evidence quotes, edit, approve/reject/re-extract/mark duplicate, history |

Nav additions (Thai labels, matching current nav):

- `แหล่งเก็บทุน` → `/admin/funding-sources`
- `ตรวจทานทุน` → `/admin/funding-intelligence` (badge = pending count when cheap)

Do not redesign `/admin/fundings`. After approval, the new row appears there like any manual funding.

Public pages: no visual redesign. New rows simply show on `/funding`.

---

## 6. Phase B integration (additive, no ranker change)

`src/lib/matching/funding-text.ts` / `eligibility.ts` / relevance:

1. Load `funding_extracted_profiles` by `funding_id` when present and `admin_locked` or approved.
2. If `eligibility_requirements` contains source quotes, use those as `quotedRequirements` **in addition to** regex on `details` (dedupe).
3. If `research_topics` are marked `explicit: true`, treat them like `กลุ่มเรื่อง` lines.
4. Ignore `ai_inferred_fields` for scoring.
5. Leave `computeFundingFit` as the sort.
6. Leave the three assessments separate (Relevance, Evidence Confidence, Eligibility).
7. Any future ranker change still requires `matching:benchmark` and a separate review, as in B.1.

Assistant: after approve, `revalidateTag("assistant-dataset")` in addition to `revalidateFundingCaches()`. Tools keep reading `fundings` only.

---

## 7. Security and governance

- Server actions for all writes; cron secret for schedule.
- Never `NEXT_PUBLIC_` for OpenAI, service role, or cron secret.
- Input validation on source URLs and selector JSON.
- Rate: `min_request_interval_ms` default 2000.
- Audit: crawl logs + extraction runs + review status transitions.
- Documents: private until admin publishes an attachment copy.
- Only registered sources; no open-web search.

Environment variables to add (proposal):

```
CRON_SECRET=
FUNDING_INTELLIGENCE_MAX_HTML_BYTES=2000000
FUNDING_INTELLIGENCE_MAX_PDF_BYTES=15000000
# OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY already required
```

---

## 8. Tests (Stage 6, listed now for scope)

| Area | Fixture / assertion |
| --- | --- |
| HTML generic adapter | Thai listing + English listing snippets |
| Irrelevant links | Footer/nav URLs not stored |
| PDF text | Text-based PDF with `[[page n]]` markers |
| Scanned detection | Image-only PDF → `needs_ocr` |
| AI schema | Mock model JSON: nulls preserved, invented field without quote dropped |
| Evidence | Deadline maps to quote + locator |
| Duplicates | Same title/agency as FD001; same source_url |
| Dates / currency | Invalid currency → null + warning; inverted dates → warning |
| Approve | Inserts `fundings` + sidecar; second crawl does not change the row |
| Version proposal | Hash change creates proposal, not overwrite |
| SSRF | `http://127.0.0.1`, `http://169.254.169.254/`, private DNS → reject |
| Unauthorised | Review actions without session fail |
| Matching | Approved sidecar quotes appear in eligibility; `computeFundingFit` order unchanged on a frozen fixture set |

No live OpenAI or live agency HTTP in CI. Mock fetch and mock chat completions.

---

## 9. Documentation to produce in Stage 7 (not now)

- This architecture (updated to “accepted”).
- Schema comments in the SQL file.
- Admin user guide (Thai).
- Environment variable list (extend `.env.local.example`).
- Test report.
- Deployment checklist (run SQL, create private bucket, set `CRON_SECRET`, verify one source manually).
- Known limitations: no OCR, no JS rendering, no auth walls, Vercel time budget, NRIIS may need a dedicated adapter.

---

## 10. Decisions requested before Stage 3

Please confirm or adjust:

1. **Sidecar table** `funding_extracted_profiles` instead of new columns on `fundings`.
2. **Private bucket** for unreviewed documents; public attach is opt-in at approval.
3. **Defer OCR** to a later phase; scanned PDFs stay in queue as `needs_ocr`.
4. **Vercel cron every 6 hours**, one source/unit per invocation.
5. **Generic HTML adapter first**; named NRIIS/NRCT adapters only if needed.
6. **Existing 20 attachments** may be ingested as a first pipeline source (`adapter_key = local_attachment`) under the same review queue — recommended, not required.
7. **No matching ranker change** in Phase C.

No SQL will be applied and no crawler will be written until these are accepted.
