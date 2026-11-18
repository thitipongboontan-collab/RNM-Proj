# Phase B matching architecture

The Phase B engine lives in `src/lib/matching/` and is additive. Existing ranking continues to use `computeFundingFit`.

```
researcher_expertise_profiles.display_profile
researcher publications + projects
fundings.title + details
        │
        ▼
assessExpertiseFundingMatch
        ├── assessFundingRelevance     → Funding Relevance Score (0–100)
        ├── assessEvidenceConfidence   → Evidence Confidence (0.00–0.97, not a probability)
        └── assessEligibility          → Eligibility Assessment (quoted call text)
```

## Three assessments stay separate

### 1. Funding Relevance Score

How closely the researcher’s expertise and research evidence align with the call.

Inputs, in order:

1. Approved or display expertise topics (primary 18, secondary 10). `insufficient_evidence` topics are ignored.
2. Methods, non-generic geography, populations, domains (6 / 6 / 8 / 6). `Thailand` and host-campus `Chiang Mai` do not count.
3. Publication and project titles need a `กลุ่มเรื่อง`/title hit or two distinctive tokens (caps 28 / 24).
4. Empty details are scored from the title only and capped at 40 (`sparse_call_title`). Generic tokens such as research/science/development never count. The old Fit Score baseline of 20 is **not** applied.

Thai/English expansion uses the existing `expandQueryTokens` map (PM2.5, highland, aging, and related terms). Topic lines such as `กลุ่มเรื่อง` are extracted from `details` before scoring.

Every hit stores a `MatchEvidence` item with kind and label so the UI and assistant can show the supporting title or topic.

### 2. Evidence Confidence

How strong and sufficient the researcher evidence is. **Not** a probability of matching or winning the grant.

| Source | When |
| --- | --- |
| `approved_profile` | Admin-locked or `analysis_status = approved` |
| `unverified_profile` | Display profile exists but is not locked |
| `titles_only` | No stored profile; titles/projects only |
| `insufficient_profile` | `insufficient_evidence` or missing profile |

The number is the mean of matched topic confidences from Phase A (`support / (support + 5)`, cap 0.97). Thin evidence is capped at 0.40.

A high relevance score with low confidence means “the titles line up, but the profile is thin.” A low relevance score with high confidence means “the profile is solid, but it does not support this call.”

### 3. Eligibility Assessment

Whether the researcher appears to meet the call’s stated applicant requirements. Research relevance is not used.

Statuses:

- `likely_eligible` — quoted text asks for faculty/researchers and the name carries a faculty title.
- `likely_ineligible` — quoted text is a student-only call and the record is faculty.
- `needs_review` — quoted text names both students and faculty, or is otherwise conflicting.
- `unknown` — requirements exist but researcher facts are missing (PhD year, appointment type, nationality). Missing facts are not ineligibility.
- `insufficient_call_data` — `details` is empty or `"-"`.

The assessment always returns `quotedRequirements` and `researcherFactsUsed`. If the fact is not in the database, the engine does not guess.

## Profile protection

`selectProfileForMatching` never scores `ai_profile`. An approved row with empty primary topics stays empty. Re-analysis of a locked row cannot change the matching input.

## Integration (non-disruptive)

| Surface | Ranking | Phase B |
| --- | --- | --- |
| `/researchers/[id]/match` | Fit Score, top 6 | Same six cards, extra explanation panel |
| Assistant `match_funding` | Fit Score | Explanation block after the ranked list |
| Assistant `match_researchers_for_funding` | Fit Score | Separate relevance-ordered explanation list |
| Assistant `researcher_intelligence` | Fit Score, top 3 | Explanation block after the ranked list |

`rankFundingsForResearcherPhaseB` / `rankResearchersForFundingPhaseB` exist for the benchmark and for the explanation list. They are not wired as the Smart Match sort.

## What Phase B does not do

- Does not crawl funder websites.
- Does not parse funding PDFs.
- Does not write `researcher_expertise` or `researcher_expertise_profiles`.
- Does not show AI expertise on public researcher pages.
- Does not infer eligibility from topical fit.
