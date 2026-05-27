import { rankFundingsForResearcher } from "@/lib/ai/intelligence/funding-fit";
import { getIntelligenceIndex } from "@/lib/ai/intelligence/index";
import { getAssistantDataset } from "@/lib/assistant-dataset";
import type { FundingFitResult, ResearcherIntelligence } from "@/lib/ai/intelligence/types";

export type ResearcherMatchResult = {
  researcher: ResearcherIntelligence;
  fundings: FundingFitResult[];
  publicationTrend: { year: number; count: number }[];
};

export async function getResearcherMatchResult(
  researcherId: string,
): Promise<ResearcherMatchResult | null> {
  const [dataset, index] = await Promise.all([getAssistantDataset(), getIntelligenceIndex()]);

  const intelligence = index.researchers.get(researcherId);
  const record = dataset.researchers.find((row) => row.row.researcher_id === researcherId);
  if (!intelligence || !record) return null;

  const fundings = rankFundingsForResearcher(dataset, researcherId, 6);

  const publicationCounts = new Map<number, number>();
  for (const publication of record.publications) {
    if (!publication.year) continue;
    publicationCounts.set(publication.year, (publicationCounts.get(publication.year) ?? 0) + 1);
  }

  const publicationTrend = [...publicationCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }));

  return {
    researcher: intelligence,
    fundings,
    publicationTrend,
  };
}
