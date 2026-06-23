import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const DEFAULT_SOURCE =
  "D:\\02_Toon Titi\\99_SOC_CMU\\06_โครงการงานบริหารงานวิจัยฯ\\99_Thiti_project\\Research_Nexus_Database_Ready.xlsx";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function stripAcademicTitles(value) {
  let result = String(value ?? "").trim();
  const patterns = [
    /^(ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|อาจารย์)\s+/,
    /^(ศ\.|รศ\.|ผศ\.|อ\.|ดร\.|นพ\.|พญ\.)\s*/,
    /^(professor emeritus|associate\s+prof\.?|assistant\s+prof\.?|assoc\.\s*prof\.?|prof\.?|dr\.?)\s*/i,
    /^นาย\s+/,
    /^นาง\s+/,
    /^นางสาว\s+/,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      const next = result.replace(pattern, "").trim();
      if (next !== result) {
        result = next;
        changed = true;
      }
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
  return stripAcademicTitles(value)
    .replace(/^นาย\s+/g, "")
    .replace(/^นาง\s+/g, "")
    .replace(/^นางสาว\s+/g, "")
    .toLowerCase();
}

function registerResearcherAlias(map, alias, researcherId) {
  const normalized = normalizeName(alias);
  if (!normalized) return;
  map.set(normalized, researcherId);
  if (alias.includes(",")) {
    const [last, first] = alias.split(",").map((part) => part.trim());
    if (first && last) {
      map.set(normalizeName(`${first} ${last}`), researcherId);
      map.set(normalizeName(`${last} ${first}`), researcherId);
    }
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    map.set(tokens.join(" "), researcherId);
    map.set([...tokens].reverse().join(" "), researcherId);
  }
}

const env = loadEnv(ENV_PATH);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const source = process.env.RESEARCH_PROJECTS_SOURCE ?? DEFAULT_SOURCE;
const wb = XLSX.readFile(source);
const researcherRows = XLSX.utils.sheet_to_json(wb.Sheets.Researchers, { defval: "" });
const assignmentRows = XLSX.utils.sheet_to_json(wb.Sheets.Project_Researchers, { defval: "" });

const { data: dbResearchers } = await supabase
  .from("researchers")
  .select("researcher_id, name_th, name_en")
  .order("researcher_id");

const byName = new Map();
for (const row of dbResearchers ?? []) {
  for (const candidate of [row.name_th, row.name_en]) {
    registerResearcherAlias(byName, candidate, row.researcher_id);
  }
}

const excelById = new Map();
for (const row of researcherRows) {
  const variants = String(row.name_variants ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  excelById.set(String(row.researcher_id).trim(), {
    nameMatchKey: normalizeName(row.name_match_key || row.name_without_title),
    displayName: String(row.display_name_suggested ?? "").trim(),
    variants,
  });
}

function resolveResearcherId(candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);
    if (normalized && byName.has(normalized)) return byName.get(normalized);
  }
  return null;
}

const projectCountByDbId = new Map();
for (const assignment of assignmentRows) {
  const excelResearcher = excelById.get(String(assignment.researcher_id).trim());
  if (!excelResearcher) continue;
  const dbId = resolveResearcherId([
    assignment.source_person_name,
    excelResearcher.displayName,
    excelResearcher.nameMatchKey,
    ...excelResearcher.variants,
  ]);
  if (!dbId) continue;
  projectCountByDbId.set(dbId, (projectCountByDbId.get(dbId) ?? 0) + 1);
}

const { data: dbProjects } = await supabase.from("researcher_projects").select("researcher_id");
const dbCount = new Map();
for (const row of dbProjects ?? []) {
  dbCount.set(row.researcher_id, (dbCount.get(row.researcher_id) ?? 0) + 1);
}

console.log("DB researchers:", dbResearchers?.length ?? 0);
console.log("Matchable from Excel:", projectCountByDbId.size);
console.log("In DB researcher_projects:", dbCount.size);
console.log("\nResearchers WITH projects (try these URLs):");
for (const [id, count] of [...projectCountByDbId.entries()].sort()) {
  const r = dbResearchers.find((x) => x.researcher_id === id);
  console.log(`  /researchers/${id} — ${count} projects — ${r?.name_th}`);
}

console.log("\nResearchers WITHOUT matched projects:");
for (const row of dbResearchers ?? []) {
  if (!projectCountByDbId.has(row.researcher_id)) {
    console.log(`  ${row.researcher_id} | ${row.name_th} | ${row.name_en ?? ""}`);
  }
}
