import {
  formatFundingFitBlock,
  rankFundingsForResearcher,
} from "@/lib/ai/intelligence/funding-fit";
import {
  formatResearcherIntelligenceBlock,
  buildResearcherIntelligence,
} from "@/lib/ai/intelligence/researcher-profile";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";
import { formatResearcherDetail } from "@/lib/ai/tools/researchers";

export function researcherIntelligenceTool(
  dataset: AssistantDataset,
  researcherId: string,
): ToolExecutionResult | null {
  const record = dataset.researchers.find((row) => row.row.researcher_id === researcherId);
  if (!record) return null;

  const departmentPeers = dataset.researchers.filter(
    (row) => row.row.department === record.row.department,
  );
  const sorted = [...departmentPeers].sort(
    (a, b) => (b.row.scholarly_output ?? 0) - (a.row.scholarly_output ?? 0),
  );
  const departmentRank = sorted.findIndex((row) => row.row.researcher_id === researcherId) + 1;

  const intelligence = buildResearcherIntelligence(
    record,
    departmentRank,
    departmentPeers.length,
  );
  const fundingMatches = rankFundingsForResearcher(dataset, researcherId, 3);

  const citations: Citation[] = [
    {
      id: record.row.researcher_id,
      type: "researcher",
      label: record.row.name_th,
      href: `/researchers/${record.row.researcher_id}`,
    },
    ...fundingMatches.map((item) => ({
      id: item.fundingId,
      type: "funding" as const,
      label: item.title,
      href: `/funding/${item.fundingId}`,
    })),
  ];

  return {
    name: "researcher_intelligence",
    summary: `Intelligence profile ${record.row.name_th}`,
    contextBlock: [
      formatResearcherIntelligenceBlock(intelligence),
      "",
      "=== ทุนที่แนะนำ (Fit Score) ===",
      formatFundingFitBlock(fundingMatches),
      "",
      "=== โปรไฟล์เต็ม ===",
      formatResearcherDetail(record),
    ].join("\n"),
    citations,
  };
}
