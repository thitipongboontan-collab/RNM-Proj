import type { ResearcherItem, ResearcherPublication } from "@/data/researchers";
import { resolveResearcherImageSrc } from "@/lib/researcher-assets";
import { createSupabaseClient } from "@/lib/supabase/client";

type ResearcherRow = {
  researcher_id: string;
  name_th: string;
  name_en: string | null;
  department: string;
  email_raw: string | null;
  phone: string | null;
  scholarly_output: number | null;
  citations: number | null;
  h_index: number | null;
};

type DegreeRow = {
  researcher_id: string;
  degree_level: string;
  degree_order: number | null;
  degree_text: string;
};

type ExpertiseRow = {
  researcher_id: string;
  expertise_order: number | null;
  expertise: string;
};

type KeywordRow = {
  researcher_id: string;
  keyword_type: string;
  keyword_order: number | null;
  keyword: string;
};

type PublicationRow = {
  publication_id: string;
  researcher_id: string;
  title: string;
  source_title: string | null;
  year: number | null;
  citations: number | null;
};

type CollaborationRow = {
  researcher_id: string;
  organization_name: string;
  org_order: number | null;
};

const DEGREE_LEVEL_RANK: Record<string, number> = {
  BA: 1,
  BNS: 1,
  MA: 2,
  MS: 2,
  PhD: 3,
  PHD: 3,
};

function mapResearcherRow(row: ResearcherRow): ResearcherItem {
  return {
    id: row.researcher_id,
    name: row.name_th,
    nameEn: row.name_en ?? undefined,
    department: row.department,
    imageSrc: resolveResearcherImageSrc(row.researcher_id),
    tags: [],
    scholarlyOutput: row.scholarly_output ?? 0,
    citations: row.citations ?? 0,
    hIndex: row.h_index ?? 0,
    email: row.email_raw ?? undefined,
    phone: row.phone ?? undefined,
  };
}

function groupKeywordTags(rows: KeywordRow[]): Map<string, string[]> {
  const grouped = new Map<string, { order: number; keyword: string }[]>();

  for (const row of rows) {
    if (row.keyword_type !== "keyword_en") continue;

    const list = grouped.get(row.researcher_id) ?? [];
    list.push({ order: row.keyword_order ?? 0, keyword: row.keyword });
    grouped.set(row.researcher_id, list);
  }

  const tagsByResearcher = new Map<string, string[]>();

  for (const [researcherId, keywords] of grouped) {
    tagsByResearcher.set(
      researcherId,
      [...keywords]
        .sort((a, b) => a.order - b.order)
        .slice(0, 3)
        .map((entry) => entry.keyword),
    );
  }

  return tagsByResearcher;
}

function sortDegrees(rows: DegreeRow[]): string[] {
  return [...rows]
    .sort((a, b) => {
      const rankA = DEGREE_LEVEL_RANK[a.degree_level.toUpperCase()] ?? 99;
      const rankB = DEGREE_LEVEL_RANK[b.degree_level.toUpperCase()] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return (a.degree_order ?? 0) - (b.degree_order ?? 0);
    })
    .map((row) => row.degree_text);
}

function sortExpertise(rows: ExpertiseRow[]): string[] {
  return [...rows]
    .sort((a, b) => (a.expertise_order ?? 0) - (b.expertise_order ?? 0))
    .map((row) => row.expertise);
}

function mapPublications(rows: PublicationRow[]): ResearcherPublication[] {
  return [...rows]
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .map((row) => ({
      id: row.publication_id,
      title: row.title,
      sourceTitle: row.source_title ?? undefined,
      year: row.year ?? undefined,
      citations: row.citations ?? undefined,
    }));
}

function sortCollaborations(rows: CollaborationRow[]): string[] {
  return [...rows]
    .sort((a, b) => (a.org_order ?? 0) - (b.org_order ?? 0))
    .map((row) => row.organization_name);
}

export async function getResearchers(): Promise<ResearcherItem[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const [researchersResult, keywordsResult] = await Promise.all([
    supabase
      .from("researchers")
      .select(
        "researcher_id, name_th, name_en, department, email_raw, phone, scholarly_output, citations, h_index",
      )
      .order("scholarly_output", { ascending: false })
      .order("researcher_id"),
    supabase
      .from("researcher_keywords")
      .select("researcher_id, keyword_type, keyword_order, keyword")
      .eq("keyword_type", "keyword_en"),
  ]);

  if (researchersResult.error) {
    console.error("Failed to fetch researchers:", researchersResult.error.message);
    return [];
  }

  if (keywordsResult.error) {
    console.error("Failed to fetch researcher keywords:", keywordsResult.error.message);
  }

  const tagsByResearcher = groupKeywordTags((keywordsResult.data ?? []) as KeywordRow[]);

  return (researchersResult.data as ResearcherRow[]).map((row) => {
    const item = mapResearcherRow(row);
    item.tags = tagsByResearcher.get(row.researcher_id) ?? [];
    return item;
  });
}

export async function getResearcherById(id: string): Promise<ResearcherItem | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data: researcher, error } = await supabase
    .from("researchers")
    .select(
      "researcher_id, name_th, name_en, department, email_raw, phone, scholarly_output, citations, h_index",
    )
    .eq("researcher_id", id)
    .maybeSingle();

  if (error || !researcher) {
    if (error) console.error("Failed to fetch researcher:", error.message);
    return null;
  }

  const [degreesResult, expertiseResult, publicationsResult, keywordsResult, collaborationsResult] =
    await Promise.all([
      supabase
        .from("researcher_degrees")
        .select("researcher_id, degree_level, degree_order, degree_text")
        .eq("researcher_id", id),
      supabase
        .from("researcher_expertise")
        .select("researcher_id, expertise_order, expertise")
        .eq("researcher_id", id),
      supabase
        .from("publications")
        .select("publication_id, researcher_id, title, source_title, year, citations")
        .eq("researcher_id", id),
      supabase
        .from("researcher_keywords")
        .select("researcher_id, keyword_type, keyword_order, keyword")
        .eq("researcher_id", id)
        .eq("keyword_type", "keyword_en"),
      supabase
        .from("researcher_collaborations")
        .select("researcher_id, organization_name, org_order")
        .eq("researcher_id", id)
        .order("org_order"),
    ]);

  const item = mapResearcherRow(researcher as ResearcherRow);

  if (degreesResult.data?.length) {
    item.education = sortDegrees(degreesResult.data as DegreeRow[]);
  }

  if (expertiseResult.data?.length) {
    item.expertise = sortExpertise(expertiseResult.data as ExpertiseRow[]);
  }

  if (keywordsResult.data?.length) {
    item.tags = groupKeywordTags(keywordsResult.data as KeywordRow[]).get(id) ?? [];
  }

  if (publicationsResult.error) {
    console.error("Failed to fetch publications:", publicationsResult.error.message);
  } else if (publicationsResult.data?.length) {
    item.publications = mapPublications(publicationsResult.data as PublicationRow[]);
  }

  if (collaborationsResult.error) {
    console.error("Failed to fetch collaborations:", collaborationsResult.error.message);
  } else if (collaborationsResult.data?.length) {
    item.collaborations = sortCollaborations(collaborationsResult.data as CollaborationRow[]);
  }

  return item;
}

export function buildDepartmentFilters(items: ResearcherItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.department, (counts.get(item.department) ?? 0) + 1);
  }

  return [
    { id: "all", label: `ทั้งหมด (${items.length})` },
    ...Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b, "th"))
      .map(([department, count]) => ({
        id: department,
        label: `${department} (${count})`,
      })),
  ];
}
