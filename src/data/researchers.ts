export type ResearcherPublication = {
  id: string;
  title: string;
  sourceTitle?: string;
  year?: number;
  citations?: number;
};

export type ResearcherProject = {
  id: string;
  title: string;
  roleLabel: string;
  projectStatus?: string;
  fiscalYearBe?: number;
};

export type ResearcherItem = {
  id: string;
  name: string;
  nameEn?: string;
  department: string;
  imageSrc?: string;
  tags: string[];
  scholarlyOutput: number;
  citations: number;
  hIndex: number;
  email?: string;
  phone?: string;
  education?: string[];
  expertise?: string[];
  publications?: ResearcherPublication[];
  projects?: ResearcherProject[];
  collaborations?: string[];
};
