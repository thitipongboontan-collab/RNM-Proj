import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const DEFAULT_SOURCE =
  "D:\\02_Toon Titi\\99_SOC_CMU\\06_โครงการงานบริหารงานวิจัยฯ\\99_Thiti_project\\List_of_Researchers,_by_Scholarly_Output (1).csv";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const SQL_OUTPUT = path.join(PROJECT_ROOT, "supabase", "researcher-scholarly-metrics-update.sql");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function resolveSourceFile() {
  const configured = process.env.SCHOLARLY_SOURCE ?? DEFAULT_SOURCE;
  if (fs.existsSync(configured)) return configured;

  const candidates = [
    configured,
    configured.replace(/\.csv$/i, ".xlsx"),
    configured.replace(/ \(1\)\.csv$/i, ".csv"),
    configured.replace(/ \(1\)\.csv$/i, ".xlsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`Source file not found. Checked:\n${candidates.join("\n")}`);
}

function readRows(sourceFile) {
  const ext = path.extname(sourceFile).toLowerCase();

  if (ext === ".csv") {
    const workbook = XLSX.readFile(sourceFile, { type: "file" });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  }

  const workbook = XLSX.readFile(sourceFile);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
}

function normalizeResearcherId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function normalizeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sqlValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function mapRow(row) {
  return {
    researcher_id: normalizeResearcherId(row.ID ?? row.Id ?? row.id),
    name: String(row.Name ?? row.name ?? "").trim(),
    scholarly_output: toNumber(row["Scholarly Output"]),
    most_recent_publication_year: toNumber(row["Most recent publication"]),
    citations: toNumber(row.Citations),
    citations_per_publication: toNumber(row["Citations per Publication"]),
    field_weighted_citation_impact: toNumber(row["Field-Weighted Citation Impact"]),
    h_index: toNumber(row["h-index"] ?? row.h_index),
  };
}

async function loadResearchersForMatching(supabase) {
  const { data, error } = await supabase
    .from("researchers")
    .select("researcher_id, name_en, name_th");

  if (error) {
    throw new Error(`Failed to load researchers for name matching: ${error.message}`);
  }

  const byLastName = new Map();

  for (const row of data ?? []) {
    const candidates = [row.name_en, row.name_th].filter(Boolean);
    for (const candidate of candidates) {
      const normalized = normalizeName(candidate);
      byLastName.set(normalized, row.researcher_id);

      const parts = normalized.split(/[\s,]+/).filter(Boolean);
      const lastName = parts[0]?.includes(",") ? parts[0].replace(",", "") : parts[parts.length - 1];
      if (lastName) {
        byLastName.set(lastName, row.researcher_id);
      }
    }
  }

  return { rows: data ?? [], byLastName };
}

function resolveResearcherId(entry, byLastName) {
  if (entry.researcher_id) return entry.researcher_id;

  const normalizedName = normalizeName(entry.name);
  if (!normalizedName) return null;

  if (byLastName.has(normalizedName)) {
    return byLastName.get(normalizedName);
  }

  const csvLast = normalizedName.split(",")[0]?.trim();
  if (csvLast && byLastName.has(csvLast)) {
    return byLastName.get(csvLast);
  }

  const csvLastToken = normalizedName.split(/[\s,]+/).filter(Boolean).pop();
  if (csvLastToken && byLastName.has(csvLastToken)) {
    return byLastName.get(csvLastToken);
  }

  return null;
}

function buildUpdateSql(researcherId, metrics) {
  return `update public.researchers
set
  scholarly_output = ${sqlValue(metrics.scholarly_output)},
  citations = ${sqlValue(metrics.citations)},
  h_index = ${sqlValue(metrics.h_index)},
  most_recent_publication_year = ${sqlValue(metrics.most_recent_publication_year)},
  citations_per_publication = ${sqlValue(metrics.citations_per_publication)},
  field_weighted_citation_impact = ${sqlValue(metrics.field_weighted_citation_impact)}
where researcher_id = ${sqlValue(researcherId)};`;
}

async function applyUpdatesWithSupabase(supabase, updates) {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const { data, error } = await supabase
      .from("researchers")
      .update(update.metrics)
      .eq("researcher_id", update.researcher_id)
      .select("researcher_id");

    if (error || !data?.length) {
      failed += 1;
      console.error(`Failed ${update.researcher_id}: ${error?.message ?? "no rows updated (check RLS/policy)"}`);
    } else {
      success += 1;
    }
  }

  return { success, failed };
}

async function main() {
  const sourceFile = resolveSourceFile();
  const rows = readRows(sourceFile).map(mapRow);

  const env = loadEnv(ENV_PATH);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in environment or .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { byLastName } = await loadResearchersForMatching(supabase);

  const updates = [];
  const skipped = [];

  for (const row of rows) {
    const researcherId = resolveResearcherId(row, byLastName);
    if (!researcherId) {
      skipped.push(row.name || "(blank row)");
      continue;
    }

    updates.push({
      researcher_id: researcherId,
      metrics: {
        scholarly_output: row.scholarly_output,
        citations: row.citations,
        h_index: row.h_index,
        most_recent_publication_year: row.most_recent_publication_year,
        citations_per_publication: row.citations_per_publication,
        field_weighted_citation_impact: row.field_weighted_citation_impact,
      },
    });
  }

  const sqlLines = [
    "-- Auto-generated by scripts/researchers/import-scholarly-metrics.mjs",
    "-- Run this in Supabase SQL Editor if direct API update is blocked by RLS.",
    "begin;",
    ...updates.map((update) => buildUpdateSql(update.researcher_id, update.metrics)),
    "commit;",
    "",
  ];

  fs.mkdirSync(path.dirname(SQL_OUTPUT), { recursive: true });
  fs.writeFileSync(SQL_OUTPUT, sqlLines.join("\n"), "utf8");

  console.log(`Source: ${sourceFile}`);
  console.log(`Prepared ${updates.length} researcher metric updates`);
  console.log(`SQL file: ${SQL_OUTPUT}`);

  if (skipped.length) {
    console.log(`Skipped ${skipped.length} rows without researcher_id match:`);
    for (const name of skipped) console.log(`  - ${name}`);
  }

  const { success, failed } = await applyUpdatesWithSupabase(supabase, updates);

  console.log(`API update success: ${success}`);
  console.log(`API update failed: ${failed}`);

  if (failed > 0 && !process.env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("");
    console.log("Direct API update was blocked. Run this SQL file in Supabase SQL Editor:");
    console.log(`  ${SQL_OUTPUT}`);
    console.log("");
    console.log("Or add SUPABASE_SERVICE_ROLE_KEY to .env.local and rerun:");
    console.log("  npm run researchers:scholarly");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
