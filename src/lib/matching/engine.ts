import type { AssistantDataset, FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { assessEvidenceConfidence } from "@/lib/matching/confidence";
import { assessEligibility } from "@/lib/matching/eligibility";
import { selectProfileForMatching } from "@/lib/matching/profile";
import { assessFundingRelevance } from "@/lib/matching/relevance";
import type {
  ExpertiseFundingMatch,
  MatchingProfileRecord,
  ResearcherFundingMatch,
} from "@/lib/matching/types";

export function assessExpertiseFundingMatch(
  researcher: ResearcherRecord,
  funding: FundingRecord,
  matchingProfile: MatchingProfileRecord,
): ExpertiseFundingMatch {
  const relevance = assessFundingRelevance(researcher, funding, matchingProfile);
  const evidenceConfidence = assessEvidenceConfidence(matchingProfile, relevance);
  const eligibility = assessEligibility(researcher, funding);

  return {
    fundingId: funding.row.funding_id,
    title: funding.row.title,
    organization: funding.row.organization,
    statusLabel: funding.row.status_label,
    openDate: funding.row.open_date,
    closeDate: funding.row.close_date,
    relevance,
    evidenceConfidence,
    eligibility,
  };
}

export function rankFundingsForResearcherPhaseB(
  dataset: AssistantDataset,
  researcherId: string,
  matchingProfile: MatchingProfileRecord,
  limit = 6,
): ExpertiseFundingMatch[] {
  const researcher = dataset.researchers.find((row) => row.row.researcher_id === researcherId);
  if (!researcher) return [];

  return [...dataset.fundings]
    .map((funding) => assessExpertiseFundingMatch(researcher, funding, matchingProfile))
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, limit);
}

export function rankResearchersForFundingPhaseB(
  dataset: AssistantDataset,
  fundingId: string,
  profiles: Map<string, MatchingProfileRecord>,
  limit = 8,
): ResearcherFundingMatch[] {
  const funding = dataset.fundings.find((row) => row.row.funding_id === fundingId);
  if (!funding) return [];

  return [...dataset.researchers]
    .map((researcher) => {
      const matchingProfile =
        profiles.get(researcher.row.researcher_id) ??
        selectProfileForMatching({ researcherId: researcher.row.researcher_id });
      const match = assessExpertiseFundingMatch(researcher, funding, matchingProfile);
      return {
        researcherId: researcher.row.researcher_id,
        nameTh: researcher.row.name_th,
        nameEn: researcher.row.name_en,
        department: researcher.row.department,
        relevance: match.relevance,
        evidenceConfidence: match.evidenceConfidence,
        eligibility: match.eligibility,
      };
    })
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, limit);
}
