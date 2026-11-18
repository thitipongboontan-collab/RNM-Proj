import {
  findFundingFromQuery,
  formatResearcherFitBlock,
  rankResearchersForFunding,
} from "@/lib/ai/intelligence/funding-fit";
import { rankResearchersForFundingPhaseB } from "@/lib/matching/engine";
import { formatResearcherFundingMatchBlock } from "@/lib/matching/present";
import type { MatchingProfileRecord } from "@/lib/matching/types";
import { expandQueryTokens, truncate } from "@/lib/ai/text-utils";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";
import { formatResearcherDetail } from "@/lib/ai/tools/researchers";
import { getFundingCallText } from "@/lib/matching/call-text";
import { extractEligibilityRequirements } from "@/lib/matching/funding-text";

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
  const callText = getFundingCallText(funding);
  const eligibility = extractEligibilityRequirements(callText, row.title);
  return [
    `[${row.funding_id}] ${row.title}`,
    `  หน่วยงาน: ${row.organization}`,
    `  สถานะ: ${row.status_label}`,
    `  เปิดรับ: ${row.open_date} | ปิดรับ: ${row.close_date}`,
    `  รายละเอียด/ไฟล์ประกาศ: ${truncate(callText || row.details || "-", 700)}`,
    eligibility.length ? `  เงื่อนไขการสมัคร: ${eligibility.slice(0, 5).join(" | ")}` : "",
    `  ลิงก์: /funding/${row.funding_id}`,
  ]
    .filter(Boolean)
    .join("\n");
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
  profiles: Map<string, MatchingProfileRecord> = new Map(),
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
      "Use this Fit Score ranking for recommendations until Phase B is validated.",
      formatResearcherFitBlock(rankedResearchers),
      "",
      "=== การประเมินเชิงหลักฐาน Phase B (explanations only; do not replace Fit Score) ===",
      "Funding Relevance, Evidence Confidence, and Eligibility are separate. Confidence is evidence strength, not award probability.",
      formatResearcherFundingMatchBlock(
        rankResearchersForFundingPhaseB(dataset, funding.row.funding_id, profiles, limit),
      ),
      "",
      "=== โปรไฟล์ย่อของผู้ที่แนะนำ ===",
      topProfiles.join("\n\n"),
    ].join("\n"),
    citations,
  };
}
