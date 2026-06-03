import { scoreText } from "@/lib/ai/text-utils";
import type { FundingFitResult, ResearcherFitResult } from "@/lib/ai/intelligence/types";
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

export function computeResearcherFit(
  researcher: ResearcherRecord,
  funding: FundingRecord,
): ResearcherFitResult {
  const fit = computeFundingFit(researcher, funding);
  return {
    researcherId: researcher.row.researcher_id,
    nameTh: researcher.row.name_th,
    nameEn: researcher.row.name_en,
    department: researcher.row.department,
    fitScore: fit.fitScore,
    reasons: fit.reasons,
  };
}

export function rankResearchersForFunding(
  dataset: AssistantDataset,
  fundingId: string,
  limit = 8,
): ResearcherFitResult[] {
  const funding = dataset.fundings.find((row) => row.row.funding_id === fundingId);
  if (!funding) return [];

  return [...dataset.researchers]
    .map((researcher) => computeResearcherFit(researcher, funding))
    .filter((item) => item.fitScore >= 25)
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
      return (b.reasons.length - a.reasons.length);
    })
    .slice(0, limit);
}

export function findFundingFromQuery(
  fundings: FundingRecord[],
  message: string,
  queryTokens: string[],
  vectorScores: Map<string, number>,
): FundingRecord | undefined {
  const normalizedMessage = message.toLowerCase();

  const ranked = [...fundings]
    .map((record) => {
      let bonus = 0;
      const titleNorm = record.row.title.toLowerCase();
      if (normalizedMessage.includes(titleNorm.slice(0, 40))) bonus += 50;
      if (/\bFD\d{3}\b/i.test(message) && message.toUpperCase().includes(record.row.funding_id)) {
        bonus += 100;
      }

      const keywordScore = scoreText(record.searchText, queryTokens);
      const vectorScore = vectorScores.get(record.row.funding_id) ?? 0;
      return {
        record,
        combined: bonus + keywordScore + vectorScore * 100,
      };
    })
    .sort((a, b) => b.combined - a.combined);

  const best = ranked[0];
  return best && best.combined > 0 ? best.record : undefined;
}

export function formatResearcherFitBlock(results: ResearcherFitResult[]): string {
  if (!results.length) return "- ไม่พบนักวิจัยที่จับคู่ได้";

  return results
    .map(
      (item) =>
        [
          `[${item.researcherId}] ${item.nameTh}${item.nameEn ? ` (${item.nameEn})` : ""}`,
          `  Fit Score: ${item.fitScore}/100`,
          `  หน่วยงาน: ${item.department}`,
          `  เหตุผล: ${item.reasons.join("; ")}`,
          `  ลิงก์: /researchers/${item.researcherId}`,
        ].join("\n"),
    )
    .join("\n\n");
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
