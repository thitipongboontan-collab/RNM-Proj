import { applyResearcherFilters } from "@/lib/ai/tools/researcher-filters";
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

export function publicationCountTool(
  records: ResearcherRecord[],
  filters: ResearcherFilters,
): ToolExecutionResult {
  const filtered = applyResearcherFilters(records, filters);
  const ranked = filtered
    .map((record) => ({
      record,
      publicationCount: record.publications.length,
      scholarlyOutput: record.row.scholarly_output ?? 0,
    }))
    .sort((a, b) => {
      if (b.publicationCount !== a.publicationCount) {
        return b.publicationCount - a.publicationCount;
      }
      return b.scholarlyOutput - a.scholarlyOutput;
    });

  const totalPublications = ranked.reduce((sum, item) => sum + item.publicationCount, 0);
  const researchersWithPublications = ranked.filter((item) => item.publicationCount > 0).length;
  const filterDescription = [
    filters.researcherId ? `researcher_id=${filters.researcherId}` : null,
    filters.department ? `ภาควิชา ${filters.department}` : null,
    filters.titles.length ? `ตำแหน่ง ${filters.titles.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const detailLines =
    ranked.length === 1
      ? [
          `จำนวนผลงานตีพิมพ์ในฐานข้อมูล publications: ${ranked[0].publicationCount} รายการ`,
          `Scholarly Output (metrics): ${ranked[0].scholarlyOutput}`,
        ]
      : [
          `จำนวนผลงานตีพิมพ์รวมทั้งหมด: ${totalPublications} รายการ`,
          `จำนวนนักวิจัยที่มีผลงานตีพิมพ์: ${researchersWithPublications} คน`,
          `จำนวนนักวิจัยในชุดข้อมูล: ${ranked.length} คน`,
          "",
          "=== จำนวนผลงานตีพิมพ์ต่อนักวิจัย ===",
          ...ranked.map(
            (item) =>
              `- [${item.record.row.researcher_id}] ${item.record.row.name_th}: ${item.publicationCount} รายการ (Scholarly Output ${item.scholarlyOutput})`,
          ),
        ];

  return {
    name: "publication_count",
    summary:
      ranked.length === 1
        ? `${ranked[0].record.row.name_th} มีผลงานตีพิมพ์ ${ranked[0].publicationCount} รายการ`
        : `ผลงานตีพิมพ์รวม ${totalPublications} รายการ จากนักวิจัย ${ranked.length} คน`,
    contextBlock: [
      "=== TOOL: publication_count (นับจากตาราง publications) ===",
      filterDescription ? `เงื่อนไข: ${filterDescription}` : "เงื่อนไข: นักวิจัยทั้งหมด",
      "นิยามการนับ: นับจำนวนแถว publications ต่อ researcher_id",
      "",
      ...detailLines,
    ].join("\n"),
    citations: ranked.slice(0, 12).map((item) => researcherCitation(item.record)),
  };
}
