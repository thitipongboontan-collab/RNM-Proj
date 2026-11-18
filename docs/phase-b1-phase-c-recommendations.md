# Phase B.1 → Phase C recommendations

Do not deploy these calibration changes automatically. Review the benchmark and funding-quality report first.

## Keep in production ranking until review

- `computeFundingFit` remains the Smart Match sort.
- Phase B cards stay explanations: Relevance, Evidence Confidence, Eligibility.

## Data work before any ranker swap

1. **P0 funding records** — especially FD007: copy topic and eligibility text from the already-uploaded PDF into `details`.
2. **P1 วช. calls** — add applicant category even when `กลุ่มเรื่อง` exists. Most current วช. rows have process text only.
3. **Attachment text** — extract already-stored PDFs/DOCX. That is local parsing, not crawling.
4. **Researcher facts** — PhD date, appointment type, and nationality are required before postdoc/young-investigator calls can move off `unknown`.

## Matching policy after data repair

- Rank by Funding Relevance only after a reviewer accepts the B.1 tables.
- Hard-filter `likely_ineligible` rather than mixing it into the score.
- Keep `needs_review` and `insufficient_call_data` visible; do not treat them as zero relevance.
- Keep Evidence Confidence off the ranking formula.

## Still out of scope

- Website crawling / automated funding collection.
- Showing AI expertise on public researcher pages.
- Overwriting approved or admin-locked profiles.
- Inferring eligibility from research topics.
