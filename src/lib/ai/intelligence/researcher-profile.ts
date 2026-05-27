import { extractAcademicTitle } from "@/lib/ai/researcher-meta";
import type { ResearcherIntelligence } from "@/lib/ai/intelligence/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

function sortKeywords(record: ResearcherRecord): string[] {
  return [...record.keywords]
    .filter((row) => row.keyword_type === "keyword_en")
    .sort((a, b) => (a.keyword_order ?? 0) - (b.keyword_order ?? 0))
    .map((row) => row.keyword);
}

function sortExpertise(record: ResearcherRecord): string[] {
  return [...record.expertise]
    .sort((a, b) => (a.expertise_order ?? 0) - (b.expertise_order ?? 0))
    .map((row) => row.expertise);
}

function computeRecencyScore(recentYear: number | null): number {
  if (!recentYear) return 0;
  const currentYear = new Date().getFullYear();
  const age = currentYear - recentYear;
  if (age <= 1) return 100;
  if (age <= 3) return 75;
  if (age <= 5) return 50;
  if (age <= 8) return 25;
  return 10;
}

function computeImpactScore(record: ResearcherRecord): number {
  const output = record.row.scholarly_output ?? 0;
  const citations = record.row.citations ?? 0;
  const hIndex = record.row.h_index ?? 0;
  const raw = Math.min(output / 50, 1) * 35 + Math.min(citations / 500, 1) * 35 + Math.min(hIndex / 20, 1) * 30;
  return Math.round(raw);
}

export function buildResearcherIntelligence(
  record: ResearcherRecord,
  departmentRank: number,
  departmentTotal: number,
): ResearcherIntelligence {
  const keywords = sortKeywords(record);
  const expertise = sortExpertise(record);
  const topTopics = [...new Set([...keywords.slice(0, 3), ...expertise.slice(0, 2)])].slice(0, 5);

  const collaborationOrgs = [...record.collaborations]
    .sort((a, b) => (a.org_order ?? 0) - (b.org_order ?? 0))
    .map((row) => row.organization_name)
    .filter((org) => org && org !== "-");

  const recentPublicationYear =
    record.publications.length > 0
      ? Math.max(...record.publications.map((row) => row.year ?? 0))
      : null;

  return {
    researcherId: record.row.researcher_id,
    nameTh: record.row.name_th,
    department: record.row.department,
    topTopics,
    collaborationBreadth: new Set(collaborationOrgs).size,
    collaborationOrgs: [...new Set(collaborationOrgs)].slice(0, 10),
    publicationCount: record.publications.length,
    recentPublicationYear: recentPublicationYear || null,
    recencyScore: computeRecencyScore(recentPublicationYear),
    impactScore: computeImpactScore(record),
    departmentRank,
    departmentTotal,
  };
}

export function formatResearcherIntelligenceBlock(intelligence: ResearcherIntelligence): string {
  const title = extractAcademicTitle(intelligence.nameTh);
  return [
    `=== Research Intelligence: ${intelligence.researcherId} ===`,
    `ชื่อ: ${intelligence.nameTh} (${title ?? "ไม่ระบุ"})`,
    `ภาควิชา: ${intelligence.department} (อันดับ ${intelligence.departmentRank}/${intelligence.departmentTotal} ในภาค)`,
    `Impact Score: ${intelligence.impactScore}/100 | Recency Score: ${intelligence.recencyScore}/100`,
    `ผลงาน: ${intelligence.publicationCount} รายการ | ล่าสุดปี ${intelligence.recentPublicationYear ?? "—"}`,
    `หัวข้อหลัก: ${intelligence.topTopics.join(", ") || "—"}`,
    `เครือข่าย: ${intelligence.collaborationBreadth} องค์กร — ${intelligence.collaborationOrgs.slice(0, 5).join(", ") || "—"}`,
  ].join("\n");
}
