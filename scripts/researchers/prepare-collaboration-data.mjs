import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const SOURCE_FILE =
  process.env.COLLABORATION_SOURCE ??
  "D:\\02_Toon Titi\\99_SOC_CMU\\06_โครงการงานบริหารงานวิจัยฯ\\99_Thiti_project\\Researcher_Collaboration_DB.xlsx";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const SEED_DIR = path.join(PROJECT_ROOT, "supabase", "seed");
const MAPPING_SHEET = "Mapping_Researcher_Org";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  }
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\n")}`, "utf8");
}

function normalizeOrganization(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeResearcherId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Excel file not found: ${SOURCE_FILE}`);
  }

  const workbook = XLSX.readFile(SOURCE_FILE);
  if (!workbook.SheetNames.includes(MAPPING_SHEET)) {
    throw new Error(`Sheet not found: ${MAPPING_SHEET}`);
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[MAPPING_SHEET], {
    defval: "",
  });

  ensureDir(SEED_DIR);

  const orderByResearcher = new Map();
  const seen = new Set();
  const collaborations = [];
  let currentResearcherId = "";
  let currentResearcherName = "";

  for (const row of rows) {
    const rowId = normalizeResearcherId(row.Researcher_ID);
    const rowName = String(row.Researcher_Name ?? "").replace(/\s+/g, " ").trim();

    if (rowId) {
      currentResearcherId = rowId;
      currentResearcherName = rowName;
    }

    const researcherId = currentResearcherId;
    const organizationName = normalizeOrganization(row["หน่วยงานความร่วมมือ"]);

    if (!researcherId || !organizationName) continue;

    const dedupeKey = `${researcherId}::${organizationName.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const orgOrder = (orderByResearcher.get(researcherId) ?? 0) + 1;
    orderByResearcher.set(researcherId, orgOrder);

    collaborations.push({
      researcher_id: researcherId,
      organization_name: organizationName,
      org_order: orgOrder,
    });
  }

  const csvPath = path.join(SEED_DIR, "researcher_collaborations.csv");
  writeCsv(csvPath, ["researcher_id", "organization_name", "org_order"], collaborations);

  const summarySheet = workbook.Sheets["สรุปนักวิจัย_เครือข่าย"];
  const summaryCount = summarySheet
    ? XLSX.utils.sheet_to_json(summarySheet, { defval: "" }).length
    : 0;

  console.log(`Prepared ${collaborations.length} collaboration rows`);
  console.log(`Researchers with collaborations: ${orderByResearcher.size}`);
  console.log(`Summary sheet rows (reference): ${summaryCount}`);
  console.log(`CSV: ${csvPath}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Run supabase/researcher-collaboration-schema.sql in Supabase SQL Editor");
  console.log("2. Import supabase/seed/researcher_collaborations.csv into researcher_collaborations");
}

main();
