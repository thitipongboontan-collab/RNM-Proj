export { assessExpertiseFundingMatch, rankFundingsForResearcherPhaseB, rankResearchersForFundingPhaseB } from "@/lib/matching/engine";
export { loadMatchingProfiles } from "@/lib/matching/profiles-repository";
export { selectProfileForMatching } from "@/lib/matching/profile";
export { CONFIDENCE_SOURCE_LABEL, ELIGIBILITY_STATUS_LABEL, RELEVANCE_BASIS_LABEL } from "@/lib/matching/present";
export type {
  EligibilityAssessment,
  EvidenceConfidence,
  ExpertiseFundingMatch,
  FundingRelevance,
  MatchingProfileRecord,
  RelevanceBasis,
  ResearcherFundingMatch,
} from "@/lib/matching/types";
