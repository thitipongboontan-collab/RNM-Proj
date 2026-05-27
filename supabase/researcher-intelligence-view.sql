-- Research Intelligence view (read-only aggregate for analytics/BI)
-- Run in Supabase SQL Editor

create or replace view public.researcher_intelligence_summary as
select
  r.researcher_id,
  r.name_th,
  r.department,
  r.scholarly_output,
  r.citations,
  r.h_index,
  r.most_recent_publication_year,
  coalesce(pub.publication_count, 0) as publication_count,
  coalesce(col.collaboration_count, 0) as collaboration_count
from public.researchers r
left join (
  select researcher_id, count(*)::int as publication_count
  from public.publications
  group by researcher_id
) pub on pub.researcher_id = r.researcher_id
left join (
  select researcher_id, count(*)::int as collaboration_count
  from public.researcher_collaborations
  where organization_name is not null and organization_name <> '-'
  group by researcher_id
) col on col.researcher_id = r.researcher_id;

grant select on public.researcher_intelligence_summary to anon, authenticated;
