/**
 * Index embeddings into Supabase pgvector (ai_documents table).
 * Prerequisites:
 * 1. Run supabase/ai-vector-schema.sql in Supabase SQL Editor
 * 2. Set OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run ai:index-embeddings
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function sortByOrder(rows, orderKey) {
  return [...rows].sort((a, b) => (a[orderKey] ?? 0) - (b[orderKey] ?? 0));
}

function buildResearcherContent(row, expertise, keywords, degrees, publications, collaborations) {
  const keywordEn = sortByOrder(
    keywords.filter((item) => item.keyword_type === "keyword_en"),
    "keyword_order",
  ).map((item) => item.keyword);
  const keywordTh = sortByOrder(
    keywords.filter((item) => item.keyword_type === "keyword_th"),
    "keyword_order",
  ).map((item) => item.keyword);
  const degreeList = sortByOrder(degrees, "degree_order").map((item) => item.degree_text);
  const expertiseList = sortByOrder(expertise, "expertise_order").map((item) => item.expertise);
  const publicationTitles = sortByOrder(publications, "year")
    .reverse()
    .map((item) => (item.year ? `${item.title} (${item.year})` : item.title));
  const collaborationOrgs = sortByOrder(collaborations, "org_order")
    .map((item) => item.organization_name)
    .filter((org) => org && org !== "-");

  return [
    `นักวิจัย ${row.name_th}`,
    row.name_en ? `ชื่ออังกฤษ ${row.name_en}` : "",
    `หน่วยงาน ${row.department}`,
    degreeList.length ? `การศึกษา ${degreeList.join("; ")}` : "",
    expertiseList.length ? `ความเชี่ยวชาญ ${expertiseList.join(", ")}` : "",
    keywordEn.length || keywordTh.length
      ? `คำสำคัญ ${[...keywordEn, ...keywordTh].join(", ")}`
      : "",
    publicationTitles.length ? `ผลงานวิจัย ${publicationTitles.join("; ")}` : "",
    collaborationOrgs.length ? `เครือข่ายความร่วมมือ ${collaborationOrgs.join(", ")}` : "",
    `scholarly output ${row.scholarly_output ?? 0}`,
    `citations ${row.citations ?? 0}`,
    `h-index ${row.h_index ?? 0}`,
  ]
    .filter(Boolean)
    .join(". ");
}

function buildFundingContent(row, attachments) {
  return [
    `แหล่งทุน ${row.title}`,
    `หน่วยงาน ${row.organization}`,
    `สถานะ ${row.status_label}`,
    `เปิดรับ ${row.open_date}`,
    `ปิดรับ ${row.close_date}`,
    `รายละเอียด ${(row.details ?? "").slice(0, 800)}`,
    attachments.length ? `ไฟล์แนบ ${attachments.map((item) => item.file_name).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

async function createEmbeddings(apiKey, inputs) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: inputs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

async function main() {
  const env = loadEnv();
  const openaiKey = env.OPENAI_API_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiKey || !supabaseUrl) {
    throw new Error("Missing OPENAI_API_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceKey) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local — required to upsert embeddings.",
    );
    console.error("Add it from Supabase Dashboard → Project Settings → API → service_role key");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const [
    { data: researchers, error: researcherError },
    { data: expertise, error: expertiseError },
    { data: keywords, error: keywordError },
    { data: degrees, error: degreeError },
    { data: publications, error: publicationError },
    { data: collaborations, error: collaborationError },
    { data: fundings, error: fundingError },
    { data: attachments, error: attachmentError },
  ] = await Promise.all([
    supabase
      .from("researchers")
      .select("researcher_id, name_th, name_en, department, scholarly_output, citations, h_index"),
    supabase.from("researcher_expertise").select("researcher_id, expertise_order, expertise"),
    supabase.from("researcher_keywords").select("researcher_id, keyword_type, keyword_order, keyword"),
    supabase.from("researcher_degrees").select("researcher_id, degree_order, degree_text"),
    supabase.from("publications").select("researcher_id, title, year"),
    supabase
      .from("researcher_collaborations")
      .select("researcher_id, org_order, organization_name"),
    supabase
      .from("fundings")
      .select("funding_id, title, organization, status_label, open_date, close_date, details"),
    supabase.from("funding_attachments").select("funding_id, file_name, file_order"),
  ]);

  for (const error of [
    researcherError,
    expertiseError,
    keywordError,
    degreeError,
    publicationError,
    collaborationError,
    fundingError,
    attachmentError,
  ]) {
    if (error) throw error;
  }

  const expertiseByResearcher = new Map();
  for (const row of expertise ?? []) {
    const list = expertiseByResearcher.get(row.researcher_id) ?? [];
    list.push(row);
    expertiseByResearcher.set(row.researcher_id, list);
  }

  const keywordsByResearcher = new Map();
  for (const row of keywords ?? []) {
    const list = keywordsByResearcher.get(row.researcher_id) ?? [];
    list.push(row);
    keywordsByResearcher.set(row.researcher_id, list);
  }

  const degreesByResearcher = new Map();
  for (const row of degrees ?? []) {
    const list = degreesByResearcher.get(row.researcher_id) ?? [];
    list.push(row);
    degreesByResearcher.set(row.researcher_id, list);
  }

  const publicationsByResearcher = new Map();
  for (const row of publications ?? []) {
    const list = publicationsByResearcher.get(row.researcher_id) ?? [];
    list.push(row);
    publicationsByResearcher.set(row.researcher_id, list);
  }

  const collaborationsByResearcher = new Map();
  for (const row of collaborations ?? []) {
    const list = collaborationsByResearcher.get(row.researcher_id) ?? [];
    list.push(row);
    collaborationsByResearcher.set(row.researcher_id, list);
  }

  const attachmentsByFunding = new Map();
  for (const row of attachments ?? []) {
    const list = attachmentsByFunding.get(row.funding_id) ?? [];
    list.push(row);
    attachmentsByFunding.set(row.funding_id, list);
  }

  const documents = [];

  for (const row of researchers ?? []) {
    documents.push({
      id: `researcher:${row.researcher_id}:profile`,
      doc_type: "researcher",
      source_id: row.researcher_id,
      chunk_key: "profile",
      content: buildResearcherContent(
        row,
        expertiseByResearcher.get(row.researcher_id) ?? [],
        keywordsByResearcher.get(row.researcher_id) ?? [],
        degreesByResearcher.get(row.researcher_id) ?? [],
        publicationsByResearcher.get(row.researcher_id) ?? [],
        collaborationsByResearcher.get(row.researcher_id) ?? [],
      ),
      metadata: { department: row.department, name_th: row.name_th },
    });
  }

  for (const row of fundings ?? []) {
    documents.push({
      id: `funding:${row.funding_id}:profile`,
      doc_type: "funding",
      source_id: row.funding_id,
      chunk_key: "profile",
      content: buildFundingContent(row, attachmentsByFunding.get(row.funding_id) ?? []),
      metadata: { organization: row.organization, title: row.title },
    });
  }

  console.log(
    `Indexing ${documents.length} documents (${researchers?.length ?? 0} researchers, ${fundings?.length ?? 0} fundings)...`,
  );

  const batchSize = 16;
  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize);
    const embeddings = await createEmbeddings(
      openaiKey,
      batch.map((doc) => doc.content),
    );

    const rows = batch.map((doc, rowIndex) => ({
      ...doc,
      embedding: embeddings[rowIndex],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("ai_documents").upsert(rows, { onConflict: "id" });
    if (error) {
      if (error.message.includes("ai_documents") || error.code === "42P01") {
        console.error("\nTable ai_documents not found.");
        console.error("Run supabase/ai-vector-schema.sql in Supabase SQL Editor first.\n");
        process.exit(1);
      }
      throw error;
    }

    console.log(`Upserted ${Math.min(index + batchSize, documents.length)}/${documents.length}`);
  }

  const { count, error: countError } = await supabase
    .from("ai_documents")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  console.log(`Done. ai_documents row count: ${count ?? documents.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
