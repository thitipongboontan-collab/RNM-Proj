# Phase C (scoped) — Admin funding + attachment matching

Website crawling is **out of scope** for this slice. Administrators still add funding in `/admin/fundings`. Matching and the AI Assistant now read:

1. Title, organization, and `details`
2. Eligibility / topic lines inside those details
3. Text extracted from uploaded PDF / Word attachments
4. Researcher expertise profiles, publications, and projects (Phase A + Phase B)

`computeFundingFit` remains the recommendation ranker. Phase B Relevance, Evidence Confidence, and Eligibility stay explanations.

## What to run

1. Apply `supabase/funding-attachment-text-schema.sql` in the Supabase SQL editor.
2. Optional backfill of the existing 20 files: `npm run funding:extract-attachments`
3. New uploads extract automatically after the admin attaches a file.
4. On an existing funding, use **วิเคราะห์ไฟล์แนบเพื่อใช้จับคู่ AI**.

Ask the assistant: `ทุน FD007 เหมาะกับใคร` or `แหล่งทุนนี้เหมาะกับนักวิจัยคนไหน`.

## Tests

- `npm run matching:test`
- `npm run funding:test-extraction`
- `npm run funding:test-match-route`

## Limits

- No OCR. Image-only PDFs are stored as `needs_ocr` and do not fill sparse calls.
- No crawling of external websites.
- Approved existing `fundings` rows are not overwritten; only attachment text columns are added.
