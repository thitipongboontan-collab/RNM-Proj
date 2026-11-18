import type { ExpertiseAnalysisStatus, ExpertiseProfile } from "@/lib/expertise/types";

export type MatchingProfileRecord = {
  researcherId: string;
  analysisStatus: ExpertiseAnalysisStatus | "missing";
  displayOrigin: "ai" | "admin" | null;
  verified: boolean;
  profile: ExpertiseProfile | null;
};

export type MatchEvidence = {
  id: string;
  kind: "primary_topic" | "secondary_topic" | "method" | "geography" | "population" | "domain" | "publication" | "project";
  label: string;
};

export type RelevanceBasis = "expertise" | "titles" | "sparse_call_title" | "none";

export type FundingRelevance = {
  score: number;
  summary: string;
  basis: RelevanceBasis;
  matchedTerms: string[];
  evidence: MatchEvidence[];
};

export type EvidenceConfidence = {
  score: number;
  kind: "evidence_strength";
  summary: string;
  source: "approved_profile" | "unverified_profile" | "titles_only" | "insufficient_profile";
};

export type EligibilityStatus =
  | "likely_eligible"
  | "likely_ineligible"
  | "unknown"
  | "insufficient_call_data"
  | "needs_review";

export type EligibilityAssessment = {
  status: EligibilityStatus;
  summary: string;
  quotedRequirements: string[];
  researcherFactsUsed: string[];
  reviewReasons: string[];
};

export type ExpertiseFundingMatch = {
  fundingId: string;
  title: string;
  organization: string;
  statusLabel: string;
  openDate: string;
  closeDate: string;
  relevance: FundingRelevance;
  evidenceConfidence: EvidenceConfidence;
  eligibility: EligibilityAssessment;
};

export type ResearcherFundingMatch = {
  researcherId: string;
  nameTh: string;
  nameEn: string | null;
  department: string;
  relevance: FundingRelevance;
  evidenceConfidence: EvidenceConfidence;
  eligibility: EligibilityAssessment;
};
