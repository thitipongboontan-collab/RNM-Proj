export const EXPERTISE_STATUSES = [
  "pending",
  "ai_analyzed",
  "needs_review",
  "approved",
  "rejected",
  "insufficient_evidence",
] as const;

export type ExpertiseAnalysisStatus = (typeof EXPERTISE_STATUSES)[number];

export type EvidenceSourceKind =
  | "publication"
  | "research_project"
  | "research_interest"
  | "keyword"
  | "academic_background";

export type EvidenceStrength = "strong" | "moderate" | "insufficient";

export type ExpertiseEvidence = {
  id: string;
  source: EvidenceSourceKind;
  label: string;
};

export type ExpertiseTopic = {
  topic: string;
  confidence: number;
  evidence_count: number;
  evidence_sources: EvidenceSourceKind[];
  strength: EvidenceStrength;
  rationale: string;
  evidence: ExpertiseEvidence[];
};

export type ExpertiseProfile = {
  researcher_id: string;
  expertise_profile: {
    primary_expertise: ExpertiseTopic[];
    secondary_expertise: ExpertiseTopic[];
    research_methods: string[];
    geographical_focus: string[];
    target_populations: string[];
    research_domains: string[];
  };
  evidence_summary: {
    total_publications_analyzed: number;
    total_projects_analyzed: number;
    total_research_interests: number;
    duplicate_publications_collapsed: number;
    dropped_single_mentions: string[];
  };
  facet_evidence: {
    research_methods: ExpertiseEvidence[];
    geographical_focus: ExpertiseEvidence[];
    target_populations: ExpertiseEvidence[];
    research_domains: ExpertiseEvidence[];
  };
  analysis_status: ExpertiseAnalysisStatus;
  last_analyzed_at: string;
  model_version: string;
  confidence_method: "evidence_weighted_v1";
};

export type ExpertiseSourcePublication = {
  id: string;
  title: string;
  year: number | null;
};

export type ExpertiseSourceProject = {
  id: string;
  title: string;
  role: string;
};

export type ExpertiseSourceRecord = {
  researcherId: string;
  department: string;
  degrees: string[];
  manualExpertise: string[];
  keywords: string[];
  publications: ExpertiseSourcePublication[];
  projects: ExpertiseSourceProject[];
};

export const CONFIDENCE_METHOD = "evidence_weighted_v1" as const;

export const DETERMINISTIC_MODEL_VERSION = "evidence-weighted-v1" as const;
