/**
 * Index embeddings into Supabase pgvector (ai_documents table).
 * Prerequisites:
 * 1. Run supabase/ai-vector-schema.sql
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
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
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
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!openaiKey || !supabaseUrl) {
    throw new Error("Missing OPENAI_API_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  const supabase = createClient(
    supabaseUrl,
    serviceKey || publishableKey,
  );

  const { data: researchers, error: researcherError } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, name_en, department, scholarly_output, citations, h_index");

  if (researcherError) throw researcherError;

  const documents = (researchers ?? []).map((row) => ({
    id: `researcher:${row.researcher_id}:profile`,
    doc_type: "researcher",
    source_id: row.researcher_id,
    chunk_key: "profile",
    content: [
      `นักวิจัย ${row.name_th}`,
      row.name_en ? `English ${row.name_en}` : "",
      `department ${row.department}`,
      `scholarly output ${row.scholarly_output ?? 0}`,
      `citations ${row.citations ?? 0}`,
      `h-index ${row.h_index ?? 0}`,
    ]
      .filter(Boolean)
      .join(". "),
    metadata: { department: row.department },
  }));

  console.log(`Indexing ${documents.length} researcher profiles...`);

  const batchSize = 20;
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
      if (error.message.includes("ai_documents")) {
        console.error(
          "Table ai_documents not found. Run supabase/ai-vector-schema.sql first.",
        );
        process.exit(1);
      }
      throw error;
    }

    console.log(`Upserted ${Math.min(index + batchSize, documents.length)}/${documents.length}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
