---
name: research-matching
description: Implements and extends researcher–funding matching on Research Nexus Matching using the canonical computeFundingFit ranker and Phase B explanation engine. Use when working on Fit Score, Smart Match, match_funding tools, /researchers/[id]/match, matching profiles, relevance/confidence/eligibility, or funding fit ranking.
---

# Research matching

## Canonical engines

| Role | Location | Use |
| --- | --- | --- |
| Production Fit Score | `src/lib/ai/intelligence/funding-fit.ts` → `computeFundingFit` | Rank fundings / researchers for match UI + assistant |
| Phase B explanations | `src/lib/matching/` → `assessExpertiseFundingMatch` | Relevance, confidence, eligibility (additive) |
| Profile selection | `src/lib/matching/profile.ts` → `selectProfileForMatching` | `display_profile` only; never score `ai_profile` |
| Match API | `src/app/api/match/route.ts` + `src/lib/match-service.ts` | HTTP match payload |

## Hard rules

1. **Never create a duplicate matching engine.** Import `computeFundingFit`.
2. Phase B must not silently replace Fit Score sort order.
3. Matching never reads `ai_profile`.
4. Keep relevance, confidence, and eligibility as separate assessments.

## Workflow

1. Read `docs/phase-b-matching-architecture.md` and the target tool/page.
2. Confirm whether the task is **ranking** (Fit Score) or **explanation** (Phase B).
3. Reuse existing helpers (`rankFundingsForResearcher`, match tools, presenters).
4. Add/adjust tests in `src/lib/matching/matching-engine.test.ts` or funding match route tests.
5. Run:
   - `npm run matching:test`
   - `npm run funding:test-match-route` when assistant/API match paths change
   - `npm run matching:benchmark` for ranking behavior changes

## Integration map

- UI: `src/components/researchers/ResearcherMatchPage.tsx`
- Assistant: `src/lib/ai/tools/match-funding.ts`, `match-researchers-for-funding.ts`, intelligence tool
- Profiles load: `src/lib/matching/profiles-repository.ts`

## Done checklist

- [ ] `computeFundingFit` imported (not reimplemented)
- [ ] No `ai_profile` scoring path added
- [ ] Phase B still separated from Fit Score sort
- [ ] Tests updated/run for touched paths
