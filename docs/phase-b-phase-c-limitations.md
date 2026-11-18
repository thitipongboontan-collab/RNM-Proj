# Phase B limitations and Phase C recommendations

Phase B adds explanations beside the existing Fit Score. It does not retire token-overlap ranking.

## Limitations that are already visible in the data

1. **Unstructured calls.** `fundings` has no applicant-type, degree, budget, or thematic-code columns. Eligibility is regex over `details`.
2. **Unread PDFs.** `funding_attachments` stores file names only. FD007-style records with empty `details` cannot be scored fairly until PDF text is extracted (still not crawling).
3. **Shared boilerplate.** Many วช. announcements repeat the same NRIIS submission paragraphs. The old matcher treats that shared language as overlap; Phase B reduces that by preferring `กลุ่มเรื่อง` and evidence titles, but Thai tokenization remains coarse.
4. **Missing researcher facts.** There is no PhD completion date, employment type, nationality, or PI-eligibility flag, so most eligibility results stay `unknown` even when the PDF would decide the question.
5. **Sparse approved profiles.** Admin-locked empty topics are respected. Relevance then depends on titles only, and confidence still reports `approved_profile`. That is correct protection, not a scoring bug.
6. **Insufficient-evidence researchers.** About half of the Phase A rows may be `insufficient_evidence`. Phase B must keep confidence low rather than invent topics.
7. **Synonym coverage.** `expandQueryTokens` helps for a few bilingual pairs (PM2.5, highland, aging). It is not a general Thai–English embedding model.
8. **No human calibration yet.** Relevance weights (18 / 10 / 8 / 7 / 6) are documented defaults. They should not become the production ranker without the benchmark review.
9. **Fit Score still ranks stopwords.** On Smart Match, RS030’s top card can be JSPS at Fit Score 100 from `science, japan, the, for`, while Phase B Relevance is 6. That gap is why ranking must stay on the old scorer until review.

## What not to do in Phase C until the benchmark is accepted

- Do not delete or disable `computeFundingFit`.
- Do not rank Smart Match by Relevance alone.
- Do not copy `ai_profile` onto public researcher pages.
- Do not overwrite `display_origin = admin` or `analysis_status = approved`.
- Do not start website crawling as a substitute for structured call data.

## Recommended Phase C work

1. **Human review of `docs/phase-b-matching-benchmark.md`.** Keep Fit Score if top-1 quality is acceptable; switch ranking only for calls where Relevance evidence is clearly better.
2. **Structured eligibility fields** on `fundings` (applicant category, faculty vs student, degree constraint, host institution). Fill them in admin, not by inference from research topics.
3. **Attachment text extraction** for already-uploaded PDFs/DOCX. This is local document parsing, not crawling.
4. **Calibrate weights** against the reviewed benchmark pairs. Treat Evidence Confidence as a display/filter, never as a win probability.
5. **Optional semantic similarity** between Phase A topic labels and `กลุ่มเรื่อง` lines, still keeping the three assessments separate.
6. **Assistant ranking policy** after validation: cite Relevance for “why this call”, keep Eligibility as a hard filter when status is `likely_ineligible`.
