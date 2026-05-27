import { scoreText } from "@/lib/ai/text-utils";
import type { FundingFitResult } from "@/lib/ai/intelligence/types";
import type { AssistantDataset, FundingRecord, ResearcherRecord } from "@/lib/assistant-context";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u0E00-\u0E7F]+/i)
    .filter((token) => token.length >= 3);
}

function overlapTokens(a: string, b: string): string[] {
  const setB = new Set(tokenize(b));
  return [...new Set(tokenize(a))].filter((token) => setB.has(token));
}

export function computeFundingFit(
  researcher: ResearcherRecord,
  funding: FundingRecord,
): FundingFitResult {
  const topicOverlap = overlapTokens(researcher.searchText, funding.searchText);
  const keywordScore = scoreText(funding.searchText, tokenize(researcher.searchText));
  const scholarlyBoost = Math.min((researcher.row.scholarly_output ?? 0) / 50, 1) * 10;
  const topicBoost = Math.min(topicOverlap.length * 4, 30);

  const fitScore = Math.min(
    Math.round(keywordScore * 0.45 + topicBoost + scholarlyBoost + 20),
    100,
  );

  const reasons: string[] = [];
  if (topicOverlap.length) {
    reasons.push(`หัวข้อที่ overlap: ${topicOverlap.slice(0, 4).join(", ")}`);
  }
  if ((researcher.row.scholarly_output ?? 0) >= 10) {
    reasons.push(`Scholarly output สูง (${researcher.row.scholarly_output})`);
  }
  if (funding.row.status_label.includes("เปิด")) {
    reasons.push("ทุนยังเปิดรับอยู่");
  }
  if (!reasons.length) {
    reasons.push("ความเกี่ยวข้องเชิงภาควิชา/คำสำคัญ");
  }

  return {
    fundingId: funding.row.funding_id,
    title: funding.row.title,
    organization: funding.row.organization,
    statusLabel: funding.row.status_label,
    openDate: funding.row.open_date,
    closeDate: funding.row.close_date,
    fitScore,
    reasons,
  };
}

export function rankFundingsForResearcher(
  dataset: AssistantDataset,
  researcherId: string,
  limit = 5,
): FundingFitResult[] {
  const researcher = dataset.researchers.find((row) => row.row.researcher_id === researcherId);
  if (!researcher) return [];

  return [...dataset.fundings]
    .map((funding) => computeFundingFit(researcher, funding))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
}

export function formatFundingFitBlock(results: FundingFitResult[]): string {
  if (!results.length) return "- ไม่พบทุนที่จับคู่ได้";

  return results
    .map(
      (item) =>
        [
          `[${item.fundingId}] ${item.title}`,
          `  Fit Score: ${item.fitScore}/100`,
          `  หน่วยงาน: ${item.organization} | สถานะ: ${item.statusLabel}`,
          `  เปิดรับ: ${item.openDate} | ปิดรับ: ${item.closeDate}`,
          `  เหตุผล: ${item.reasons.join("; ")}`,
          `  ลิงก์: /funding/${item.fundingId}`,
        ].join("\n"),
    )
    .join("\n\n");
}
