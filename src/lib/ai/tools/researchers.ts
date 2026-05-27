import {
  buildTitleSummary,
  extractAcademicTitle,
  filterResearchersByTitles,
} from "@/lib/ai/researcher-meta";
import { scoreText } from "@/lib/ai/text-utils";
import type { Citation, ResearcherFilters, ToolExecutionResult } from "@/lib/ai/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

function researcherCitation(record: ResearcherRecord): Citation {
  return {
    id: record.row.researcher_id,
    type: "researcher",
    label: record.row.name_th,
    href: `/researchers/${record.row.researcher_id}`,
  };
}

function formatListEntry(record: ResearcherRecord): string {
  const title = extractAcademicTitle(record.row.name_th);
  return `- [${record.row.researcher_id}] ${record.row.name_th} | ${title ?? "ไม่ระบุ"} | ${record.row.department}`;
}

function applyFilters(
  records: ResearcherRecord[],
  filters: ResearcherFilters,
): ResearcherRecord[] {
  let filtered = records;

  if (filters.titles.length) {
    filtered = filterResearchersByTitles(filtered, filters.titles);
  }

  if (filters.department) {
    filtered = filtered.filter((record) => record.row.department === filters.department);
  }

  if (filters.researcherId) {
    filtered = filtered.filter((record) => record.row.researcher_id === filters.researcherId);
  }

  return filtered;
}

function sortKeywords(rows: { keyword: string; keyword_order: number | null; keyword_type: string }[]) {
  return [...rows]
    .filter((row) => row.keyword_type === "keyword_en")
    .sort((a, b) => (a.keyword_order ?? 0) - (b.keyword_order ?? 0))
    .map((row) => row.keyword);
}

function sortExpertise(rows: { expertise: string; expertise_order: number | null }[]) {
  return [...rows]
    .sort((a, b) => (a.expertise_order ?? 0) - (b.expertise_order ?? 0))
    .map((row) => row.expertise);
}

export function formatResearcherDetail(record: ResearcherRecord): string {
  const { row, expertise, publications, collaborations } = record;
  const lines = [
    `[${row.researcher_id}] ${row.name_th}${row.name_en ? ` (${row.name_en})` : ""}`,
    `  ตำแหน่ง: ${extractAcademicTitle(row.name_th) ?? "ไม่ระบุ"}`,
    `  หน่วยงาน: ${row.department}`,
    `  Scholarly Output: ${row.scholarly_output ?? 0} | Citations: ${row.citations ?? 0} | h-index: ${row.h_index ?? 0}`,
  ];

  const expertiseList = sortExpertise(expertise);
  const keywordList = sortKeywords(record.keywords);

  if (expertiseList.length) lines.push(`  ความเชี่ยวชาญ: ${expertiseList.slice(0, 5).join("; ")}`);
  if (keywordList.length) lines.push(`  keywords: ${keywordList.slice(0, 5).join(", ")}`);

  const publicationList = [...publications]
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 5)
    .map((item) => (item.year ? `${item.title} (${item.year})` : item.title));

  if (publicationList.length) {
    lines.push(`  ผลงานล่าสุด: ${publicationList.join(" | ")}`);
  }

  const collaborationList = [...collaborations]
    .sort((a, b) => (a.org_order ?? 0) - (b.org_order ?? 0))
    .slice(0, 6)
    .map((item) => item.organization_name);

  if (collaborationList.length) {
    lines.push(`  เครือข่าย: ${collaborationList.join(", ")}`);
  }

  lines.push(`  ลิงก์: /researchers/${row.researcher_id}`);
  return lines.join("\n");
}

export function countResearchersTool(
  records: ResearcherRecord[],
  filters: ResearcherFilters,
): ToolExecutionResult {
  const filtered = applyFilters(records, filters);
  const citations = filtered.map(researcherCitation);

  const departmentCounts = new Map<string, number>();
  for (const record of filtered) {
    departmentCounts.set(
      record.row.department,
      (departmentCounts.get(record.row.department) ?? 0) + 1,
    );
  }

  const departmentSummary = [...departmentCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "th"))
    .map(([department, count]) => `- ${department}: ${count} คน`)
    .join("\n");

  const filterDescription = [
    filters.titles.length ? `ตำแหน่ง ${filters.titles.join(", ")}` : null,
    filters.department ? `ภาควิชา ${filters.department}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    name: "count_researchers",
    summary: `พบ ${filtered.length} คน${filterDescription ? ` (${filterDescription})` : ""}`,
    contextBlock: [
      "=== TOOL: count_researchers (ผลลัพธ์จาก SQL/aggregate ครบทุกคน) ===",
      `จำนวนที่ตรงเงื่อนไข: ${filtered.length} คน`,
      filterDescription ? `เงื่อนไข: ${filterDescription}` : "เงื่อนไข: ทั้งหมด",
      "",
      "=== จำนวนตามตำแหน่ง (ชุดที่กรองแล้ว) ===",
      buildTitleSummary(filtered),
      departmentSummary ? `\n=== จำนวนตามภาควิชา (ชุดที่กรองแล้ว) ===\n${departmentSummary}` : "",
      filtered.length
        ? `\n=== รายชื่อครบ (${filtered.length} คน) ===\n${filtered.map(formatListEntry).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    citations,
  };
}

export function searchResearchersTool(
  records: ResearcherRecord[],
  queryTokens: string[],
  vectorScores: Map<string, number>,
  filters: ResearcherFilters,
  limit = 8,
): ToolExecutionResult {
  const pool = applyFilters(records, filters);

  const ranked = [...pool]
    .map((record) => {
      const keywordScore = scoreText(record.searchText, queryTokens);
      const vectorScore = vectorScores.get(record.row.researcher_id) ?? 0;
      const combined = vectorScore * 100 + keywordScore;
      return { record, combined, vectorScore, keywordScore };
    })
    .sort((a, b) => {
      if (b.combined !== a.combined) return b.combined - a.combined;
      return (b.record.row.scholarly_output ?? 0) - (a.record.row.scholarly_output ?? 0);
    })
    .slice(0, limit);

  const citations = ranked.map((item) => researcherCitation(item.record));

  return {
    name: "search_researchers",
    summary: `ค้นพบ ${ranked.length} คนที่เกี่ยวข้อง`,
    contextBlock: [
      `=== TOOL: search_researchers (${ranked.length} คน) ===`,
      ranked.length
        ? ranked.map((item) => formatResearcherDetail(item.record)).join("\n\n")
        : "- ไม่พบนักวิจัยที่ตรงเงื่อนไข",
    ].join("\n"),
    citations,
  };
}

export function getResearcherProfileTool(
  records: ResearcherRecord[],
  researcherId: string,
): ToolExecutionResult | null {
  const record = records.find((item) => item.row.researcher_id === researcherId);
  if (!record) return null;

  return {
    name: "get_researcher_profile",
    summary: `โปรไฟล์ ${record.row.name_th}`,
    contextBlock: [
      "=== TOOL: get_researcher_profile ===",
      formatResearcherDetail(record),
    ].join("\n"),
    citations: [researcherCitation(record)],
  };
}

export function buildResearcherOverviewBlock(records: ResearcherRecord[]): string {
  const departmentCounts = new Map<string, number>();
  for (const record of records) {
    departmentCounts.set(
      record.row.department,
      (departmentCounts.get(record.row.department) ?? 0) + 1,
    );
  }

  const departmentSummary = [...departmentCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "th"))
    .map(([department, count]) => `- ${department}: ${count} คน`)
    .join("\n");

  return [
    `นักวิจัยทั้งหมด: ${records.length} คน`,
    "",
    "=== จำนวนตามตำแหน่งทางวิชาการ (ข้อมูลครบทุกคน) ===",
    buildTitleSummary(records),
    "",
    "=== จำนวนตามภาควิชา (ข้อมูลครบทุกคน) ===",
    departmentSummary,
  ].join("\n");
}
