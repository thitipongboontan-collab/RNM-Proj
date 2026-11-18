import {
  formatFundingFitBlock,
  rankFundingsForResearcher,
} from "@/lib/ai/intelligence/funding-fit";
import { assessExpertiseFundingMatch } from "@/lib/matching/engine";
import { formatExpertiseFundingMatchBlock } from "@/lib/matching/present";
import type { MatchingProfileRecord } from "@/lib/matching/types";
import { selectProfileForMatching } from "@/lib/matching/profile";
import { scoreText } from "@/lib/ai/text-utils";
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

export function matchFundingTool(
  dataset: AssistantDataset,
  queryTokens: string[],
  vectorScores: Map<string, number>,
  researcherId?: string,
  limit = 5,
  profiles?: Map<string, MatchingProfileRecord>,
): ToolExecutionResult {
  let primaryResearcher = researcherId
    ? dataset.researchers.find((item) => item.row.researcher_id === researcherId)
    : undefined;

  if (!primaryResearcher) {
    primaryResearcher = [...dataset.researchers]
      .map((record) => ({
        record,
        score:
          scoreText(record.searchText, queryTokens) +
          (vectorScores.get(record.row.researcher_id) ?? 0) * 100,
      }))
      .sort((a, b) => b.score - a.score)[0]?.record;
  }

  const citations: Citation[] = [];

  if (primaryResearcher) {
    citations.push({
      id: primaryResearcher.row.researcher_id,
      type: "researcher",
      label: primaryResearcher.row.name_th,
      href: `/researchers/${primaryResearcher.row.researcher_id}`,
    });
  }

  const rankedFundings = primaryResearcher
    ? rankFundingsForResearcher(dataset, primaryResearcher.row.researcher_id, limit)
    : [];
  const matchingProfile = primaryResearcher
    ? (profiles?.get(primaryResearcher.row.researcher_id) ??
      selectProfileForMatching({ researcherId: primaryResearcher.row.researcher_id }))
    : selectProfileForMatching({ researcherId: "unknown" });
  const phaseBFundings = rankedFundings.flatMap((item) => {
    const funding = dataset.fundings.find((row) => row.row.funding_id === item.fundingId);
    if (!funding || !primaryResearcher) return [];
    return [assessExpertiseFundingMatch(primaryResearcher, funding, matchingProfile)];
  });

  for (const item of rankedFundings) {
    citations.push(fundingCitation(item.fundingId, item.title));
  }

  return {
    name: "match_funding",
    summary: primaryResearcher
      ? `จับคู่ทุนให้ ${primaryResearcher.row.name_th} (${rankedFundings.length} รายการ)`
      : "ไม่พบนักวิจัยสำหรับจับคู่ทุน",
    contextBlock: [
      "=== TOOL: match_funding (Research Intelligence) ===",
      primaryResearcher
        ? `นักวิจัยอ้างอิง:\n${formatResearcherDetail(primaryResearcher)}`
        : "นักวิจัยอ้างอิง: ไม่ระบุ",
      "",
      `=== ทุนที่แนะนำ (${rankedFundings.length} รายการ) ===`,
      "Use this Fit Score ranking for recommendations until Phase B is validated.",
      formatFundingFitBlock(rankedFundings),
      "",
      "=== การประเมินเชิงหลักฐาน Phase B (explanations only; do not replace Fit Score) ===",
      "Funding Relevance, Evidence Confidence, and Eligibility are separate. Confidence is evidence strength, not award probability.",
      formatExpertiseFundingMatchBlock(phaseBFundings),
    ].join("\n"),
    citations,
  };
}
