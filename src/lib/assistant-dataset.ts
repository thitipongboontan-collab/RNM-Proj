import { unstable_cache } from "next/cache";
import { normalizeText } from "@/lib/ai/researcher-meta";
import { getFundings } from "@/lib/funding-repository";import { getResearchers } from "@/lib/researchers-repository";
import { createSupabaseClient } from "@/lib/supabase/client";

type ResearcherRow = {
  researcher_id: string;
  name_th: string;
  name_en: string | null;
  department: string;
  email_raw: string | null;
  scholarly_output: number | null;
  citations: number | null;
  h_index: number | null;
};

type KeywordRow = {
  researcher_id: string;
  keyword_type: string;
  keyword_order: number | null;
  keyword: string;
};

type ExpertiseRow = {
  researcher_id: string;
  expertise_order: number | null;
  expertise: string;
};

type DegreeRow = {
  researcher_id: string;
  degree_order: number | null;
  degree_text: string;
};

type PublicationRow = {
  researcher_id: string;
  title: string;
  year: number | null;
};

type CollaborationRow = {
  researcher_id: string;
  organization_name: string;
  org_order: number | null;
};

type FundingRow = {
  funding_id: string;
  title: string;
  organization: string;
  status_label: string;
  open_date: string;
  close_date: string;
  published_date: string;
  details: string;
  source_url: string | null;
};

type AttachmentRow = {
  funding_id: string;
  file_name: string;
};

export type ResearcherRecord = {
  row: ResearcherRow;
  keywords: KeywordRow[];
  expertise: ExpertiseRow[];
  degrees: DegreeRow[];
  publications: PublicationRow[];
  collaborations: CollaborationRow[];
  searchText: string;
};

export type FundingRecord = {
  row: FundingRow;
  attachments: AttachmentRow[];
  searchText: string;
};

export type AssistantDataset = {
  researchers: ResearcherRecord[];
  fundings: FundingRecord[];
};

function groupByResearcherId<T extends { researcher_id: string }>(
  rows: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.researcher_id) ?? [];
    list.push(row);
    grouped.set(row.researcher_id, list);
  }
  return grouped;
}

function buildResearcherSearchText(
  row: ResearcherRow,
  keywords: KeywordRow[],
  expertise: ExpertiseRow[],
  degrees: DegreeRow[],
  publications: PublicationRow[],
  collaborations: CollaborationRow[] = [],
): string {
  return normalizeText(
    [
      row.name_th,
      row.name_en ?? "",
      row.department,
      ...keywords.map((item) => item.keyword),
      ...expertise.map((item) => item.expertise),
      ...degrees.map((item) => item.degree_text),
      ...publications.map((item) => item.title),
      ...collaborations.map((item) => item.organization_name),
    ].join(" "),
  );
}

function buildFundingSearchText(row: FundingRow, attachments: AttachmentRow[]): string {
  return normalizeText(
    [
      row.title,
      row.organization,
      row.status_label,
      row.open_date,
      row.close_date,
      row.details,
      ...attachments.map((item) => item.file_name),
    ].join(" "),
  );
}

async function loadDatasetFromSupabase(): Promise<AssistantDataset | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const [
    researchersResult,
    keywordsResult,
    expertiseResult,
    degreesResult,
    publicationsResult,
    collaborationsResult,
    fundingsResult,
    attachmentsResult,
  ] = await Promise.all([
    supabase
      .from("researchers")
      .select(
        "researcher_id, name_th, name_en, department, email_raw, scholarly_output, citations, h_index",
      )
      .order("scholarly_output", { ascending: false }),
    supabase.from("researcher_keywords").select("researcher_id, keyword_type, keyword_order, keyword"),
    supabase.from("researcher_expertise").select("researcher_id, expertise_order, expertise"),
    supabase.from("researcher_degrees").select("researcher_id, degree_order, degree_text"),
    supabase.from("publications").select("researcher_id, title, year"),
    supabase
      .from("researcher_collaborations")
      .select("researcher_id, organization_name, org_order"),
    supabase
      .from("fundings")
      .select(
        "funding_id, title, organization, status_label, open_date, close_date, published_date, details, source_url",
      )
      .order("display_order"),
    supabase.from("funding_attachments").select("funding_id, file_name").order("file_order"),
  ]);

  if (researchersResult.error || !researchersResult.data?.length) {
    return null;
  }

  const keywordsByResearcher = groupByResearcherId((keywordsResult.data ?? []) as KeywordRow[]);
  const expertiseByResearcher = groupByResearcherId((expertiseResult.data ?? []) as ExpertiseRow[]);
  const degreesByResearcher = groupByResearcherId((degreesResult.data ?? []) as DegreeRow[]);
  const publicationsByResearcher = groupByResearcherId((publicationsResult.data ?? []) as PublicationRow[]);
  const collaborationsByResearcher = groupByResearcherId(
    (collaborationsResult.data ?? []) as CollaborationRow[],
  );

  const attachmentsByFunding = new Map<string, AttachmentRow[]>();
  for (const row of (attachmentsResult.data ?? []) as AttachmentRow[]) {
    const list = attachmentsByFunding.get(row.funding_id) ?? [];
    list.push(row);
    attachmentsByFunding.set(row.funding_id, list);
  }

  const researchers = (researchersResult.data as ResearcherRow[]).map((row) => {
    const keywords = keywordsByResearcher.get(row.researcher_id) ?? [];
    const expertise = expertiseByResearcher.get(row.researcher_id) ?? [];
    const degrees = degreesByResearcher.get(row.researcher_id) ?? [];
    const publications = publicationsByResearcher.get(row.researcher_id) ?? [];
    const collaborations = collaborationsByResearcher.get(row.researcher_id) ?? [];

    return {
      row,
      keywords,
      expertise,
      degrees,
      publications,
      collaborations,
      searchText: buildResearcherSearchText(
        row,
        keywords,
        expertise,
        degrees,
        publications,
        collaborations,
      ),
    };
  });

  const fundings = ((fundingsResult.data ?? []) as FundingRow[]).map((row) => {
    const attachments = attachmentsByFunding.get(row.funding_id) ?? [];
    return {
      row,
      attachments,
      searchText: buildFundingSearchText(row, attachments),
    };
  });

  return { researchers, fundings };
}

async function loadDatasetFallback(): Promise<AssistantDataset> {
  const [fundings, researchers] = await Promise.all([getFundings(), getResearchers()]);

  return {
    researchers: researchers.map((item) => {
      const row: ResearcherRow = {
        researcher_id: item.id,
        name_th: item.name,
        name_en: item.nameEn ?? null,
        department: item.department,
        email_raw: item.email ?? null,
        scholarly_output: item.scholarlyOutput,
        citations: item.citations,
        h_index: item.hIndex,
      };
      const keywords = item.tags.map((keyword, index) => ({
        researcher_id: item.id,
        keyword_type: "keyword_en",
        keyword_order: index + 1,
        keyword,
      }));
      const expertise = (item.expertise ?? []).map((value, index) => ({
        researcher_id: item.id,
        expertise_order: index + 1,
        expertise: value,
      }));
      const degrees = (item.education ?? []).map((value, index) => ({
        researcher_id: item.id,
        degree_order: index + 1,
        degree_text: value,
      }));
      const publications = (item.publications ?? []).map((publication) => ({
        researcher_id: item.id,
        title: publication.title,
        year: publication.year ?? null,
      }));
      const collaborations = (item.collaborations ?? []).map((organizationName, index) => ({
        researcher_id: item.id,
        organization_name: organizationName,
        org_order: index + 1,
      }));

      const searchText = buildResearcherSearchText(
        row,
        keywords,
        expertise,
        degrees,
        publications,
        collaborations,
      );

      return {
        row,
        keywords,
        expertise,
        degrees,
        publications,
        collaborations,
        searchText,
      };
    }),
    fundings: fundings.map((item) => {
      const row: FundingRow = {
        funding_id: item.id,
        title: item.title,
        organization: item.organization,
        status_label: item.statusLabel,
        open_date: item.openDate,
        close_date: item.closeDate,
        published_date: item.publishedDate,
        details: [item.detail.fullTitle, ...item.detail.bodySections].join(" "),
        source_url: item.detail.nriisUrl || item.detail.nrctUrl || null,
      };
      const attachments = item.detail.attachments.map((attachment) => ({
        funding_id: item.id,
        file_name: attachment.fileName,
      }));

      return {
        row,
        attachments,
        searchText: buildFundingSearchText(row, attachments),
      };
    }),
  };
}

const getAssistantDatasetCached = unstable_cache(
  async () => (await loadDatasetFromSupabase()) ?? (await loadDatasetFallback()),
  ["assistant-dataset"],
  { revalidate: 300 },
);

export async function getAssistantDataset(): Promise<AssistantDataset> {
  return getAssistantDatasetCached();
}
