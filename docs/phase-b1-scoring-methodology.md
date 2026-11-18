# Phase B.1 scoring methodology

`computeFundingFit` is unchanged and still ranks Smart Match. This document records the calibrated Phase B assessments only.

## Evidence for each adjustment

| Change | Benchmark evidence | Decision |
| --- | --- | --- |
| Drop reverse label matching (`termHits(label, fundingTerms)`) | RS011 / FD015 reached Relevance 100 from `Qualitative Research` / `Survey Research` plus `research.mis.cmu.ac.th` | Match only when a distinctive label token appears in the call text |
| Stopwords: research, science, development, studies, นวัตกรรม, วิจัย | RS030 / FD025 Fit Score 100 from `science, japan, the, for`; HYI inflated by `university, studies` | Those tokens never create a hit by themselves |
| Ignore generic geography `Thailand` and CMU host-city `Chiang Mai` | RS030 / FD001 and FD002 scored 37 with evidence “Thailand” on social and ageing calls | Geography must be more specific than the funder’s country or host campus |
| Publication/project need a topic-line hit or ≥2 distinctive tokens; caps 28 / 24 | 53 and 47 publications stacked to Relevance 100 on unrelated calls | Distinctive overlap first, then a cap so volume cannot dominate |
| Score titles against `title` + `กลุ่มเรื่อง` / `แผนงานย่อย` only | Shared `ยุทธศาสตร์ที่ 2 … สังคมและสิ่งแวดล้อม` lines made air-quality papers look relevant to social and ageing วช. calls | Drop `ยุทธศาสตร์` / generic `แผนงาน` lines from the topic extractor |
| Do not map English “agricultural” (as in biomass burning) to `เกษตร` | FD007 scored 29 for an air-quality researcher from “agricultural biomass” | Agriculture stems require เกษตร / agriculture / farming / rice, not the adjective agricultural |
| Do not treat compact `กลุ่มเรื่อง` blocks as empty | Test fixture for FD004 is short but contains usable topic lines; length &lt; 80 was wrongly marked sparse | Sparse = empty/`-`, or short text with no topic/eligibility markers |
| Sparse-call cap 40, title-only scoring | FD007 details are `-`; air-quality papers must stay low, agriculture titles should still be able to hit `เกษตร` | Evaluate the title, cap the score, label `sparse_call_title` |
| Ignore `display_profile` topics when `insufficient_evidence` | 23 profiles are insufficient; they still have titles/projects | Fallback to titles; confidence source `titles_only`; do not invent expertise |
| Mixed student + faculty wording → `needs_review` | A call that names both groups is not decidable from stored researcher facts | Never pick eligible/ineligible from relevance |
| `อาจารย์ที่ปรึกษา` is not an applicant category | FD023 names an advisor on a master’s-student call | Faculty ineligible only when the applicant is a student |

## Weights (Phase B.1)

| Signal | Weight | Cap |
| --- | --- | --- |
| Primary expertise topic | 18 | none (count of real hits is small) |
| Secondary expertise topic | 10 | none |
| Method | 6 | none |
| Geography (non-generic) | 6 | none |
| Population | 8 | none |
| Domain | 6 | none |
| Publication hitting `กลุ่มเรื่อง` / title topic line | 7 | 28 combined |
| Publication with ≥2 distinctive tokens in details | 5 | 28 combined |
| Project hitting topic line | 8 | 24 combined |
| Project with ≥2 distinctive tokens | 6 | 24 combined |
| Sparse call (empty details) | same hits against title only | 40 |

The old Fit Score baseline of +20 is still not applied here.

## Three assessments

1. **Funding Relevance** — distinctive overlap of expertise and titles with the call. `basis` is `expertise`, `titles`, `sparse_call_title`, or `none`.
2. **Evidence Confidence** — evidence strength, not award probability. `titles_only` when the profile is insufficient/missing but titles hit. `insufficient_profile` when neither profile nor titles help. Approved/admin-locked rows stay `approved_profile`.
3. **Eligibility** — quoted call lines plus known researcher facts (academic title, department). Statuses: `likely_eligible`, `likely_ineligible`, `unknown`, `insufficient_call_data`, `needs_review`. Missing call data is not ineligibility.

## What was not changed

- Production ranking still uses `computeFundingFit`.
- `ai_profile` is never scored.
- Approved/admin-locked `display_profile` is never overwritten.
- No crawling, no invented funding fields, no second matching engine.
