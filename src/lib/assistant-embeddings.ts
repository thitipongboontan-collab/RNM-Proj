import type { AssistantDataset, FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { createSupabaseClient } from "@/lib/supabase/client";

export type SearchDocument = {
  id: string;
  type: "researcher" | "funding";
  text: string;
  embedding: number[];
};

export type SearchResult = {
  id: string;
  type: "researcher" | "funding";
  score: number;
};

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

let embeddingCache: {
  fingerprint: string;
  expiresAt: number;
  index: SearchDocument[];
} | null = null;

const EMBEDDING_CACHE_TTL_MS = 60 * 60 * 1000;

function datasetFingerprint(dataset: AssistantDataset): string {
  const researcherIds = dataset.researchers.map((item) => item.row.researcher_id).join(",");
  const fundingIds = dataset.fundings.map((item) => item.row.funding_id).join(",");
  return `${dataset.researchers.length}:${dataset.fundings.length}:${researcherIds}:${fundingIds}`;
}

function sortKeywords(rows: { keyword: string; keyword_order: number | null }[]): string[] {
  return [...rows]
    .sort((a, b) => (a.keyword_order ?? 0) - (b.keyword_order ?? 0))
    .map((row) => row.keyword);
}

function buildResearcherDocument(record: ResearcherRecord): string {
  const { row, keywords, expertise, publications, collaborations } = record;
  const keywordEn = sortKeywords(
    keywords.filter((item) => item.keyword_type === "keyword_en"),
  );
  const keywordTh = sortKeywords(
    keywords.filter((item) => item.keyword_type === "keyword_th"),
  );
  const expertiseList = [...expertise]
    .sort((a, b) => (a.expertise_order ?? 0) - (b.expertise_order ?? 0))
    .map((item) => item.expertise);
  const publicationTitles = [...publications]
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 8)
    .map((item) => item.title);
  const collaborationOrgs = [...collaborations]
    .sort((a, b) => (a.org_order ?? 0) - (b.org_order ?? 0))
    .slice(0, 10)
    .map((item) => item.organization_name);

  return [
    `นักวิจัย ${row.name_th}`,
    row.name_en ? `ชื่ออังกฤษ ${row.name_en}` : "",
    `หน่วยงาน ${row.department}`,
    `ความเชี่ยวชาญ ${expertiseList.join(", ")}`,
    `คำสำคัญ ${[...keywordEn, ...keywordTh].join(", ")}`,
    `ผลงานวิจัย ${publicationTitles.join(", ")}`,
    collaborationOrgs.length ? `เครือข่ายความร่วมมือ ${collaborationOrgs.join(", ")}` : "",
    `h-index ${row.h_index ?? 0}`,
    "หัวข้อที่เกี่ยวข้อง: มลพิษอากาศ PM2.5 ฝุ่น สิ่งแวดล้อม สังคม การย้ายถิ่น ทุนวิจัย เครือข่ายความร่วมมือ",
  ]
    .filter(Boolean)
    .join(". ");
}

function buildFundingDocument(record: FundingRecord): string {
  const { row, attachments } = record;
  return [
    `แหล่งทุน ${row.title}`,
    `หน่วยงาน ${row.organization}`,
    `สถานะ ${row.status_label}`,
    `เปิดรับ ${row.open_date}`,
    `ปิดรับ ${row.close_date}`,
    `รายละเอียด ${row.details.slice(0, 800)}`,
    attachments.length ? `ไฟล์แนบ ${attachments.map((item) => item.file_name).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildSearchDocuments(dataset: AssistantDataset): Omit<SearchDocument, "embedding">[] {
  const documents: Omit<SearchDocument, "embedding">[] = [];

  for (const record of dataset.researchers) {
    documents.push({
      id: record.row.researcher_id,
      type: "researcher",
      text: buildResearcherDocument(record),
    });
  }

  for (const record of dataset.fundings) {
    documents.push({
      id: record.row.funding_id,
      type: "funding",
      text: buildFundingDocument(record),
    });
  }

  return documents;
}

async function createEmbeddings(apiKey: string, inputs: string[]): Promise<number[][]> {
  if (!inputs.length) return [];

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: { embedding: number[]; index: number }[];
  };

  return (data.data ?? [])
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildEmbeddingIndex(apiKey: string, dataset: AssistantDataset): Promise<SearchDocument[]> {
  const documents = buildSearchDocuments(dataset);
  const embeddings = await createEmbeddings(
    apiKey,
    documents.map((document) => document.text),
  );

  return documents.map((document, index) => ({
    ...document,
    embedding: embeddings[index] ?? [],
  }));
}

export async function getEmbeddingIndex(
  apiKey: string,
  dataset: AssistantDataset,
): Promise<SearchDocument[]> {
  const fingerprint = datasetFingerprint(dataset);
  const now = Date.now();

  if (embeddingCache && embeddingCache.fingerprint === fingerprint && embeddingCache.expiresAt > now) {
    return embeddingCache.index;
  }

  const index = await buildEmbeddingIndex(apiKey, dataset);
  embeddingCache = {
    fingerprint,
    expiresAt: now + EMBEDDING_CACHE_TTL_MS,
    index,
  };

  return index;
}

async function searchSupabaseVectors(
  queryEmbedding: number[],
  topK: number,
): Promise<SearchResult[] | null> {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase.rpc("match_ai_documents", {
      query_embedding: queryEmbedding,
      match_count: topK,
      filter_doc_type: null,
    });

    if (error) {
      if (
        error.message.includes("match_ai_documents") ||
        error.message.includes("ai_documents") ||
        error.code === "PGRST202"
      ) {
        return null;
      }
      console.error("Supabase vector search error:", error.message);
      return null;
    }

    if (!data?.length) return null;

    return data.map((row: { source_id: string; doc_type: string; score: number }) => ({
      id: row.source_id,
      type: row.doc_type as "researcher" | "funding",
      score: row.score,
    }));
  } catch (error) {
    console.error("Supabase vector search failed:", error);
    return null;
  }
}

export async function searchWithEmbeddings(
  apiKey: string,
  dataset: AssistantDataset,
  query: string,
  topK = 12,
): Promise<SearchResult[]> {
  const [queryEmbedding] = await createEmbeddings(apiKey, [query]);
  if (!queryEmbedding?.length) return [];

  const supabaseResults = await searchSupabaseVectors(queryEmbedding, topK);
  if (supabaseResults?.length) {
    return supabaseResults;
  }

  const index = await getEmbeddingIndex(apiKey, dataset);
  if (!index.length) return [];

  return index
    .map((document) => ({
      id: document.id,
      type: document.type,
      score: cosineSimilarity(queryEmbedding, document.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function buildVectorScoreMap(results: SearchResult[]): Map<string, number> {
  return new Map(results.map((result) => [result.id, result.score]));
}
