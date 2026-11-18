---
name: supabase-data
description: Works with Research Nexus Matching Supabase schemas, clients, repositories, RLS, storage, and admin data access. Use when editing SQL under supabase/, repositories, server-admin clients, expertise/funding/news/researcher persistence, or diagnosing missing columns and RLS issues.
---

# Supabase data

## Client map

| Client | Path | Key |
| --- | --- | --- |
| Browser | `src/lib/supabase/browser.ts` | Publishable |
| Server (user) | `src/lib/supabase/server.ts` | Publishable + cookies |
| Service admin | `src/lib/supabase/server-admin.ts` | Service role |

Never import the service-role client into Client Components.

## Schema locations

All under `supabase/`. Notable scripts:

- `researchers-schema.sql`, collaboration / projects / scholarly metrics
- `funding-schema.sql`, `funding-attachment-text-schema.sql`, storage scripts
- `researcher-expertise-profiles-schema.sql` — `ai_profile`, `display_profile`
- `research-news-schema.sql`, `analytics-schema.sql`, `ai-vector-schema.sql`

Treat scripts as **operator-run** in the Supabase SQL Editor unless the user asks to execute them.

## Safe change pattern

1. Find the existing table/script and repository that already touch the domain.
2. Prefer additive SQL (`if not exists`, new nullable columns, new tables).
3. Mirror types in `src/lib/admin/*-types.ts` or domain types.
4. Extend the existing repository; avoid a second data access layer.
5. Keep RLS: public read where already public; writes via admin/service patterns.
6. Document the exact SQL file the human must run.

## Expertise profiles

```text
ai_profile       → AI draft (not for matching scores)
display_profile  → approved/display input for matching + admin UI
display_origin   → ai | admin
analysis_status  → pending | ai_analyzed | needs_review | approved | rejected | insufficient_evidence
```

Use `src/lib/expertise/repository.ts` for reads/writes.

## Auth tie-in

- Admin gate: `src/lib/admin/auth.ts` + `src/middleware.ts`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, publishable key, `SUPABASE_SERVICE_ROLE_KEY`, optional `ADMIN_EMAIL`

## Anti-patterns

- Destructive drops/truncates without explicit user request
- New matching tables that duplicate Fit Score logic
- Exposing service role to the browser
- Running migrations unprompted
