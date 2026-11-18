---
name: agent-testing
description: Runs and interprets Research Nexus Matching verification checklists for matching, expertise, funding extraction, assistant match routes, lint, and ranking integrity. Use when validating agent work, preparing a QA report, or confirming computeFundingFit and profile safety after changes.
---

# Agent testing

## When to use

After any change to matching, expertise, assistant tools, funding attachment text, admin auth, or APIs that feed Smart Match.

## Ranking integrity (always)

Search the diff / touched files for scoring logic:

- Must import `computeFundingFit` from `@/lib/ai/intelligence/funding-fit` (or re-export path that ends there)
- Fail if a new Fit Score formula appears outside that module
- Confirm Phase B changes do not swap production sort unless explicitly requested

## Profile integrity (always)

- Matching path uses `selectProfileForMatching` / `display_profile`
- No new reads that score `ai_profile`
- Rejected / insufficient-evidence behavior preserved

## Command matrix

Run the smallest set that covers the change:

| Area | Command |
| --- | --- |
| Phase B matching engine | `npm run matching:test` |
| Expertise engine | `npm run expertise:test` |
| Attachment text extraction | `npm run funding:test-extraction` |
| Funding match route / assistant wiring | `npm run funding:test-match-route` |
| Ranking benchmark (behavior change) | `npm run matching:benchmark` |
| Lint | `npm run lint` |

Do not add dependencies or run DB migrations as part of testing.

## Manual smoke (when UI/API touched)

1. `/researchers/[id]/match` — cards ordered by Fit Score; explanations coherent
2. Assistant match prompts — citations present; no invented fundings
3. `/admin` — unauthenticated users redirected to login
4. Expertise admin — approve/reject still separates AI vs display profile

## Report template

```markdown
## Test report
- Change summary:
- Commands: (command → pass/fail)
- computeFundingFit reuse: PASS/FAIL
- ai_profile isolation: PASS/FAIL
- Issues:
- Verdict: Approve | Fix required
```

## QA agent note

`nexus-qa-reviewer` should prefer this skill for post-implementation verification.
