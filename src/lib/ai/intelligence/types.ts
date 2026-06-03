export type ResearcherIntelligence = {
  researcherId: string;
  nameTh: string;
  department: string;
  topTopics: string[];
  collaborationBreadth: number;
  collaborationOrgs: string[];
  publicationCount: number;
  recentPublicationYear: number | null;
  recencyScore: number;
  impactScore: number;
  departmentRank: number;
  departmentTotal: number;
};

export type FundingFitResult = {
  fundingId: string;
  title: string;
  organization: string;
  statusLabel: string;
  openDate: string;
  closeDate: string;
  fitScore: number;
  reasons: string[];
};

export type ResearcherFitResult = {
  researcherId: string;
  nameTh: string;
  nameEn: string | null;
  department: string;
  fitScore: number;
  reasons: string[];
};

export type CollaborationLink = {
  researcherId: string;
  nameTh: string;
  department: string;
  sharedOrganizations: string[];
  overlapScore: number;
};

export type PublicationTrendPoint = {
  year: number;
  count: number;
};

export type TopicTrend = {
  topic: string;
  count: number;
};

export type IntelligenceIndex = {
  researchers: Map<string, ResearcherIntelligence>;
  publicationTrendByYear: PublicationTrendPoint[];
  topTopics: TopicTrend[];
};
