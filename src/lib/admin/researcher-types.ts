export type AdminResearcherRecord = {
  researcherId: string;
  nameTh: string;
  nameEn: string;
  department: string;
  email: string;
  phone: string;
  scholarlyOutput: number;
  citations: number;
  hIndex: number;
  mostRecentPublicationYear: number | null;
  citationsPerPublication: number | null;
  fieldWeightedCitationImpact: number | null;
  imagePath: string | null;
  education: string[];
  expertise: string[];
  keywordsEn: string[];
  keywordsTh: string[];
  collaborations: string[];
};

export type AdminResearcherFormInput = {
  nameTh: string;
  nameEn: string;
  department: string;
  email: string;
  phone: string;
  scholarlyOutput: number;
  citations: number;
  hIndex: number;
  mostRecentPublicationYear: number | null;
  citationsPerPublication: number | null;
  fieldWeightedCitationImpact: number | null;
  educationText: string;
  expertiseText: string;
  keywordsEnText: string;
  keywordsThText: string;
  collaborationsText: string;
};

export type AdminResearcherListItem = {
  researcherId: string;
  nameTh: string;
  department: string;
  scholarlyOutput: number;
  imagePath: string | null;
};
