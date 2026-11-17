# Phase A test report: Researcher Expertise Intelligence

Date: 2026-11-17  
Command: `npm run expertise:test`  
Result: passed

The tests call `buildExpertiseProfile()` and `applyAiNormalization()` directly. They do not call OpenAI and they do not write to Supabase. Publication abstracts and project descriptions are not in the database, so every case uses titles, manual expertise, keywords, department, and project titles only.

Confidence is `support / (support + 5)`, capped at 0.97. It is an evidence-saturation score, not a calibrated probability. Support weights: publication 3 (max 12), project 2.5 (max 10), manual expertise 2, keyword 1 (max 3), degree 0.5 (max 1). A topic is dropped when it has no publication or project evidence, or fewer than two evidence items. Primary expertise also needs support of at least 6 and repeated works, or one publication plus a project or a matching manual expertise line.

## Cases

| Case | Fixture | Result |
| --- | --- | --- |
| Many publications | 8 forced-migration titles, 2 projects, matching expertise and keywords | Forced migration is primary, cites publications, and has at least two evidence items. Qualitative research and survey research are methods. Thailand is a geographical focus. Migrant communities is a population. Sociology and Anthropology comes from the department. |
| Few publications | Two urban-poverty titles plus the same expertise and keyword | The profile is analyzed, and the only kept topic is urban poverty. |
| No publication records | Expertise and keyword "tourism" only | Status `insufficient_evidence`. No primary topic is created. |
| Broad interests | Five unrelated expertise lines and five unrelated keywords, plus three community-forestry titles and one museum title | Community forestry is kept. Water, music, finance, sport, and tourism are not. |
| Interdisciplinary | Air-pollution cluster and gender-and-work cluster | Both topics are kept. |
| Unrelated titles | Two climate-adaptation titles plus one poetry title and one museum title | Climate adaptation is kept. Poetry and museum are not. |
| Incomplete profile | Empty department, no degrees, keywords, expertise, publications, or projects | Status `insufficient_evidence`. No domain is invented. |
| Duplicate publications | The same community-forestry title twice, plus one further title | One duplicate is collapsed. Two unique titles are analyzed. Community forestry is kept. |

## Validation

An AI payload that names "Quantum biology" and cites an evidence id that does not exist is ignored. The evidence-backed forced-migration topic remains. A payload that cites real evidence ids is accepted and the model version is recorded.

## Not covered by this run

- Live OpenAI normalization against the configured key.
- Admin approve / reject against Supabase. That path needs `supabase/researcher-expertise-profiles-schema.sql` applied first, then an authenticated admin session.
- The public profile panel stays hidden until a non-rejected `display_profile` exists, so the existing researcher page is unchanged for researchers that have not been analyzed.
