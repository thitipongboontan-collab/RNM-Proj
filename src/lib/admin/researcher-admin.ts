import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type {
  AdminResearcherFormInput,
  AdminResearcherListItem,
  AdminResearcherRecord,
} from "@/lib/admin/researcher-types";
import { removeResearcherImage, uploadResearcherImage } from "@/lib/admin/researcher-upload";

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
  most_recent_publication_year: number | null;
  citations_per_publication: number | null;
  field_weighted_citation_impact: number | null;
  image_path: string | null;
};

type DegreeRow = {
  degree_order: number | null;
  degree_text: string;
};

type ExpertiseRow = {
  expertise_order: number | null;
  expertise: string;
};

type KeywordRow = {
  keyword_type: string;
  keyword_order: number | null;
  keyword: string;
};

type CollaborationRow = {
  org_order: number | null;
  organization_name: string;
};

function getAdminClient() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
}

function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sortDegrees(rows: DegreeRow[]): string[] {
  return [...rows]
    .sort((a, b) => (a.degree_order ?? 0) - (b.degree_order ?? 0))
    .map((row) => row.degree_text);
}

function sortExpertise(rows: ExpertiseRow[]): string[] {
  return [...rows]
    .sort((a, b) => (a.expertise_order ?? 0) - (b.expertise_order ?? 0))
    .map((row) => row.expertise);
}

function sortKeywords(rows: KeywordRow[], type: "keyword_en" | "keyword_th"): string[] {
  return [...rows]
    .filter((row) => row.keyword_type === type)
    .sort((a, b) => (a.keyword_order ?? 0) - (b.keyword_order ?? 0))
    .map((row) => row.keyword);
}

function sortCollaborations(rows: CollaborationRow[]): string[] {
  return [...rows]
    .sort((a, b) => (a.org_order ?? 0) - (b.org_order ?? 0))
    .map((row) => row.organization_name);
}

function mapResearcherRecord(
  row: ResearcherRow,
  degrees: DegreeRow[],
  expertise: ExpertiseRow[],
  keywords: KeywordRow[],
  collaborations: CollaborationRow[],
): AdminResearcherRecord {
  return {
    researcherId: row.researcher_id,
    nameTh: row.name_th,
    nameEn: row.name_en ?? "",
    department: row.department,
    email: row.email_raw ?? "",
    phone: row.phone ?? "",
    scholarlyOutput: row.scholarly_output ?? 0,
    citations: row.citations ?? 0,
    hIndex: row.h_index ?? 0,
    mostRecentPublicationYear: row.most_recent_publication_year,
    citationsPerPublication: row.citations_per_publication,
    fieldWeightedCitationImpact: row.field_weighted_citation_impact,
    imagePath: row.image_path,
    education: sortDegrees(degrees),
    expertise: sortExpertise(expertise),
    keywordsEn: sortKeywords(keywords, "keyword_en"),
    keywordsTh: sortKeywords(keywords, "keyword_th"),
    collaborations: sortCollaborations(collaborations),
  };
}

export async function listAdminResearchers(): Promise<AdminResearcherListItem[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, department, scholarly_output, image_path")
    .order("scholarly_output", { ascending: false })
    .order("researcher_id");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ResearcherRow[]).map((row) => ({
    researcherId: row.researcher_id,
    nameTh: row.name_th,
    department: row.department,
    scholarlyOutput: row.scholarly_output ?? 0,
    imagePath: row.image_path,
  }));
}

export async function getAdminResearcherById(id: string): Promise<AdminResearcherRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("researchers")
    .select(
      "researcher_id, name_th, name_en, department, email_raw, phone, scholarly_output, citations, h_index, most_recent_publication_year, citations_per_publication, field_weighted_citation_impact, image_path",
    )
    .eq("researcher_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const [degreesResult, expertiseResult, keywordsResult, collaborationsResult] = await Promise.all([
    supabase
      .from("researcher_degrees")
      .select("degree_order, degree_text")
      .eq("researcher_id", id),
    supabase
      .from("researcher_expertise")
      .select("expertise_order, expertise")
      .eq("researcher_id", id),
    supabase
      .from("researcher_keywords")
      .select("keyword_type, keyword_order, keyword")
      .eq("researcher_id", id),
    supabase
      .from("researcher_collaborations")
      .select("org_order, organization_name")
      .eq("researcher_id", id),
  ]);

  if (degreesResult.error) throw new Error(degreesResult.error.message);
  if (expertiseResult.error) throw new Error(expertiseResult.error.message);
  if (keywordsResult.error) throw new Error(keywordsResult.error.message);
  if (collaborationsResult.error) throw new Error(collaborationsResult.error.message);

  return mapResearcherRecord(
    data as ResearcherRow,
    (degreesResult.data ?? []) as DegreeRow[],
    (expertiseResult.data ?? []) as ExpertiseRow[],
    (keywordsResult.data ?? []) as KeywordRow[],
    (collaborationsResult.data ?? []) as CollaborationRow[],
  );
}

async function generateNextResearcherId(): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("researchers")
    .select("researcher_id")
    .order("researcher_id", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const lastId = data?.[0]?.researcher_id ?? "RS000";
  const numeric = Number.parseInt(String(lastId).replace(/^RS/i, ""), 10);
  const next = Number.isFinite(numeric) ? numeric + 1 : 1;
  return `RS${String(next).padStart(3, "0")}`;
}

async function syncResearcherChildren(
  researcherId: string,
  input: AdminResearcherFormInput,
): Promise<void> {
  const supabase = getAdminClient();
  const education = parseLines(input.educationText);
  const expertise = parseLines(input.expertiseText);
  const keywordsEn = parseLines(input.keywordsEnText);
  const keywordsTh = parseLines(input.keywordsThText);
  const collaborations = parseLines(input.collaborationsText);

  const [degreesDelete, expertiseDelete, keywordsDelete, collaborationsDelete] = await Promise.all([
    supabase.from("researcher_degrees").delete().eq("researcher_id", researcherId),
    supabase.from("researcher_expertise").delete().eq("researcher_id", researcherId),
    supabase.from("researcher_keywords").delete().eq("researcher_id", researcherId),
    supabase.from("researcher_collaborations").delete().eq("researcher_id", researcherId),
  ]);

  for (const result of [degreesDelete, expertiseDelete, keywordsDelete, collaborationsDelete]) {
    if (result.error) throw new Error(result.error.message);
  }

  if (education.length) {
    const { error } = await supabase.from("researcher_degrees").insert(
      education.map((text, index) => ({
        researcher_id: researcherId,
        degree_level: "OTHER",
        degree_order: index + 1,
        degree_text: text,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (expertise.length) {
    const { error } = await supabase.from("researcher_expertise").insert(
      expertise.map((text, index) => ({
        researcher_id: researcherId,
        expertise_order: index + 1,
        expertise: text,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const keywordRows = [
    ...keywordsEn.map((keyword, index) => ({
      researcher_id: researcherId,
      keyword_type: "keyword_en" as const,
      keyword_order: index + 1,
      keyword,
    })),
    ...keywordsTh.map((keyword, index) => ({
      researcher_id: researcherId,
      keyword_type: "keyword_th" as const,
      keyword_order: index + 1,
      keyword,
    })),
  ];

  if (keywordRows.length) {
    const { error } = await supabase.from("researcher_keywords").insert(keywordRows);
    if (error) throw new Error(error.message);
  }

  if (collaborations.length) {
    const { error } = await supabase.from("researcher_collaborations").insert(
      collaborations.map((organizationName, index) => ({
        researcher_id: researcherId,
        organization_name: organizationName,
        org_order: index + 1,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

function buildResearcherRowPayload(input: AdminResearcherFormInput) {
  return {
    name_th: input.nameTh.trim(),
    name_en: input.nameEn.trim() || null,
    department: input.department.trim(),
    email_raw: input.email.trim() || null,
    phone: input.phone.trim() || null,
    scholarly_output: input.scholarlyOutput,
    citations: input.citations,
    h_index: input.hIndex,
    most_recent_publication_year: input.mostRecentPublicationYear,
    citations_per_publication: input.citationsPerPublication,
    field_weighted_citation_impact: input.fieldWeightedCitationImpact,
    updated_at: new Date().toISOString(),
  };
}

export async function createAdminResearcher(
  input: AdminResearcherFormInput,
  imageFile: File | null,
): Promise<string> {
  const supabase = getAdminClient();
  const researcherId = await generateNextResearcherId();

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadResearcherImage(researcherId, imageFile);
  }

  const { error } = await supabase.from("researchers").insert({
    researcher_id: researcherId,
    ...buildResearcherRowPayload(input),
    image_path: imagePath,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncResearcherChildren(researcherId, input);
  return researcherId;
}

export async function updateAdminResearcher(
  researcherId: string,
  input: AdminResearcherFormInput,
  imageFile: File | null,
  removeImage: boolean,
): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminResearcherById(researcherId);
  if (!existing) {
    throw new Error("Researcher not found.");
  }

  let imagePath = existing.imagePath;

  if (removeImage && imagePath) {
    await removeResearcherImage(imagePath);
    imagePath = null;
  }

  if (imageFile && imageFile.size > 0) {
    if (imagePath) {
      await removeResearcherImage(imagePath);
    }
    imagePath = await uploadResearcherImage(researcherId, imageFile);
  }

  const { error } = await supabase
    .from("researchers")
    .update({
      ...buildResearcherRowPayload(input),
      image_path: imagePath,
    })
    .eq("researcher_id", researcherId);

  if (error) {
    throw new Error(error.message);
  }

  await syncResearcherChildren(researcherId, input);
}

export async function deleteAdminResearcher(researcherId: string): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminResearcherById(researcherId);
  if (!existing) return;

  if (existing.imagePath) {
    await removeResearcherImage(existing.imagePath);
  }

  await supabase.from("researcher_collaborations").delete().eq("researcher_id", researcherId);

  const { error } = await supabase.from("researchers").delete().eq("researcher_id", researcherId);
  if (error) {
    throw new Error(error.message);
  }
}
