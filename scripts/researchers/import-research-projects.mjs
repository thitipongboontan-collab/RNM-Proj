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

function resolveSourceFile() {
  const configured = process.env.RESEARCH_PROJECTS_SOURCE ?? DEFAULT_SOURCE;
  if (fs.existsSync(configured)) return configured;
  throw new Error(`Source file not found: ${configured}`);
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

function roleLabelFromAssignment(roleCode, roleNameTh) {
  if (roleCode === "PI") return "หัวหน้าโครงการ";
  if (roleCode === "CO") return "ผู้ร่วมวิจัย";
  return String(roleNameTh || "ผู้ร่วมวิจัย").trim();
}

async function loadResearchersForMatching(supabase) {
  const { data, error } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, name_en");

  if (error) {
    throw new Error(`Failed to load researchers: ${error.message}`);
  }

  const byName = new Map();

  for (const row of data ?? []) {
    for (const candidate of [row.name_th, row.name_en]) {
      registerResearcherAlias(byName, candidate, row.researcher_id);
    }
  }

  return byName;
}

function buildExcelResearcherMap(researcherRows) {
  const byExcelId = new Map();

  for (const row of researcherRows) {
    const variants = String(row.name_variants ?? "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    byExcelId.set(String(row.researcher_id).trim(), {
      nameMatchKey: normalizeName(row.name_match_key || row.name_without_title),
      displayName: String(row.display_name_suggested ?? "").trim(),
      variants,
    });
  }

  return byExcelId;
}

function resolveResearcherId(candidates, researchersByName) {
  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);
    if (!normalized) continue;
    if (researchersByName.has(normalized)) {
      return researchersByName.get(normalized);
    }
  }

  return null;
}

function buildProjectMap(projectRows) {
  const byProjectId = new Map();

  for (const row of projectRows) {
    byProjectId.set(String(row.project_id).trim(), {
      projectName: String(row.project_name_th ?? "").trim(),
      projectStatus: String(row.project_status ?? "").trim() || null,
      fiscalYearBe: Number.parseInt(String(row.fiscal_year_be ?? ""), 10) || null,
    });
  }

  return byProjectId;
}

async function main() {
  const sourceFile = resolveSourceFile();
  const workbook = XLSX.readFile(sourceFile);
  const projectRows = XLSX.utils.sheet_to_json(workbook.Sheets.Projects, { defval: "" });
  const researcherRows = XLSX.utils.sheet_to_json(workbook.Sheets.Researchers, { defval: "" });
  const assignmentRows = XLSX.utils.sheet_to_json(workbook.Sheets.Project_Researchers, {
    defval: "",
  });

  const env = loadEnv(ENV_PATH);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const researchersByName = await loadResearchersForMatching(supabase);
  const excelResearchers = buildExcelResearcherMap(researcherRows);
  const projectsById = buildProjectMap(projectRows);

  const records = [];
  const skipped = [];

  for (const [index, assignment] of assignmentRows.entries()) {
    const excelResearcherId = String(assignment.researcher_id ?? "").trim();
    const projectId = String(assignment.project_id ?? "").trim();
    const project = projectsById.get(projectId);
    const excelResearcher = excelResearchers.get(excelResearcherId);

    if (!project?.projectName || !excelResearcher?.nameMatchKey) {
      skipped.push(`assignment ${assignment.assignment_id}: missing project or researcher`);
      continue;
    }

    const researcherId = resolveResearcherId(
      [
        assignment.source_person_name,
        excelResearcher.displayName,
        excelResearcher.nameMatchKey,
        ...excelResearcher.variants,
      ],
      researchersByName,
    );
    if (!researcherId) {
      skipped.push(
        `${excelResearcher.displayName || excelResearcherId}: no RS match for "${excelResearcher.nameMatchKey}"`,
      );
      continue;
    }

    records.push({
      researcher_id: researcherId,
      project_name: project.projectName,
      role_label: roleLabelFromAssignment(assignment.role_code, assignment.role_name_th),
      project_order: Number.parseInt(String(assignment.role_sequence ?? index + 1), 10) || index + 1,
      external_project_id: projectId,
      project_status: project.projectStatus,
      fiscal_year_be: project.fiscalYearBe,
    });
  }

  const deduped = [];
  const seen = new Set();

  for (const record of records) {
    const key = `${record.researcher_id}::${record.project_name}::${record.role_label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }

  const { error: deleteError } = await supabase
    .from("researcher_projects")
    .delete()
    .not("id", "is", null);

  if (deleteError) {
    throw new Error(
      `Failed to clear researcher_projects (run supabase/researcher-projects-schema.sql first): ${deleteError.message}`,
    );
  }

  const chunkSize = 200;
  let inserted = 0;

  for (let offset = 0; offset < deduped.length; offset += chunkSize) {
    const chunk = deduped.slice(offset, offset + chunkSize);
    const { error } = await supabase.from("researcher_projects").insert(chunk);
    if (error) {
      throw new Error(`Insert failed at offset ${offset}: ${error.message}`);
    }
    inserted += chunk.length;
  }

  const researcherCount = new Set(deduped.map((row) => row.researcher_id)).size;

  console.log(`Source: ${sourceFile}`);
  console.log(`Imported ${inserted} project assignments for ${researcherCount} researchers`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} rows:`);
    for (const line of skipped.slice(0, 20)) console.log(`  - ${line}`);
    if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
