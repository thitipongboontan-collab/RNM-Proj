import { rankFundingsForResearcher } from "@/lib/ai/intelligence/funding-fit";
import { getIntelligenceIndex } from "@/lib/ai/intelligence/index";
import { getAssistantDataset } from "@/lib/assistant-dataset";
import type { FundingFitResult, ResearcherIntelligence } from "@/lib/ai/intelligence/types";
import {
  assessExpertiseFundingMatch,
  loadMatchingProfiles,
  selectProfileForMatching,
  type ExpertiseFundingMatch,
} from "@/lib/matching";

export type ResearcherMatchResult = {
  researcher: ResearcherIntelligence;
  fundings: FundingFitResult[];
  phaseBFundings: ExpertiseFundingMatch[];
  publicationTrend: { year: number; count: number }[];
};

export async function getResearcherMatchResult(
  researcherId: string,
): Promise<ResearcherMatchResult | null> {
  const [dataset, index, profiles] = await Promise.all([
    getAssistantDataset(),
    getIntelligenceIndex(),
    loadMatchingProfiles(),
  ]);

  const intelligence = index.researchers.get(researcherId);
  const record = dataset.researchers.find((row) => row.row.researcher_id === researcherId);
  if (!intelligence || !record) return null;

  const fundings = rankFundingsForResearcher(dataset, researcherId, 6);
  const matchingProfile =
    profiles.get(researcherId) ?? selectProfileForMatching({ researcherId });
  const phaseBFundings = fundings.flatMap((item) => {
    const funding = dataset.fundings.find((row) => row.row.funding_id === item.fundingId);
    if (!funding) return [];
    return [assessExpertiseFundingMatch(record, funding, matchingProfile)];
  });

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
    phaseBFundings,
    publicationTrend,
  };
}
