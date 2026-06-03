import {
  findFundingFromQuery,
  formatResearcherFitBlock,
  rankResearchersForFunding,
} from "@/lib/ai/intelligence/funding-fit";
import { expandQueryTokens } from "@/lib/ai/text-utils";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";
import { formatResearcherDetail } from "@/lib/ai/tools/researchers";

function fundingCitation(id: string, title: string): Citation {
  return {
    id,
    type: "funding",
    label: title,
    href: `/funding/${id}`,
  };
}

function researcherCitation(id: string, label: string): Citation {
  return {
    id,
    type: "researcher",
    label,
    href: `/researchers/${id}`,
  };
}

function formatFundingSummary(funding: AssistantDataset["fundings"][number]): string {
  const { row } = funding;
  return [
    `[${row.funding_id}] ${row.title}`,
    `  หน่วยงาน: ${row.organization}`,
    `  สถานะ: ${row.status_label}`,
    `  เปิดรับ: ${row.open_date} | ปิดรับ: ${row.close_date}`,
    `  ลิงก์: /funding/${row.funding_id}`,
  ].join("\n");
}

function extractFundingId(message: string): string | undefined {
  const match = message.match(/\b(FD\d{3})\b/i);
  return match?.[1]?.toUpperCase();
}

export function matchResearchersForFundingTool(
  dataset: AssistantDataset,
  message: string,
  queryTokens: string[],
  vectorScores: Map<string, number>,
  fundingId?: string,
  limit = 8,
): ToolExecutionResult | null {
  const explicitFundingId = fundingId ?? extractFundingId(message);
  const funding =
    (explicitFundingId?.startsWith("FD")
      ? dataset.fundings.find((item) => item.row.funding_id === explicitFundingId)
      : undefined) ??
    findFundingFromQuery(
      dataset.fundings,
      message,
      queryTokens.length ? queryTokens : expandQueryTokens(message),
      vectorScores,
    );

  if (!funding) return null;

  const rankedResearchers = rankResearchersForFunding(
    dataset,
    funding.row.funding_id,
    limit,
  );

  if (!rankedResearchers.length) return null;

  const topProfiles = rankedResearchers
    .slice(0, 5)
    .map((item) => {
      const record = dataset.researchers.find(
        (row) => row.row.researcher_id === item.researcherId,
      );
      return record ? formatResearcherDetail(record) : null;
    })
    .filter(Boolean);

  const citations: Citation[] = [
    fundingCitation(funding.row.funding_id, funding.row.title),
    ...rankedResearchers.map((item) =>
      researcherCitation(item.researcherId, item.nameTh),
    ),
  ];

  return {
    name: "match_researchers_for_funding",
    summary: `จับคู่นักวิจัย ${rankedResearchers.length} คน ให้ทุน ${funding.row.funding_id}`,
    contextBlock: [
      "=== TOOL: match_researchers_for_funding (จับคู่ทุน → นักวิจัย) ===",
      "=== ทุนที่อ้างอิง ===",
      formatFundingSummary(funding),
      "",
      `=== นักวิจัยที่เหมาะสม (${rankedResearchers.length} คน, เรียง Fit Score) ===`,
      formatResearcherFitBlock(rankedResearchers),
      "",
      "=== โปรไฟล์ย่อของผู้ที่แนะนำ ===",
      topProfiles.join("\n\n"),
    ].join("\n"),
    citations,
  };
}
