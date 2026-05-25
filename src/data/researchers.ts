export type ResearcherItem = {
  id: string;
  name: string;
  department: string;
  tags: string[];
  scholarlyOutput: number;
  citations: number;
  hIndex: number;
  email?: string;
  phone?: string;
  education?: string[];
  expertise?: string[];
  publications?: string[];
};

const LIST_CARD: Omit<ResearcherItem, "id"> = {
  name: "ผศ.ดร. จิตใจดี มีตังเยอะ",
  department: "ภาควิชาภูมิศาสตร์",
  tags: ["Ethnicity Studies", "Community Development", "Participatory Methodology"],
  scholarlyOutput: 20,
  citations: 20,
  hIndex: 20,
};

export const RESEARCHER_ITEMS: ResearcherItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: i === 0 ? "amporn-jira" : `researcher-${i + 1}`,
  ...LIST_CARD,
  ...(i === 0
    ? {
        name: "รศ.ดร. อัมพร จิรัฐติกร",
        department: "ภาควิชาสังคมศาสตร์กับการพัฒนา",
        email: "amporn.j@cmu.ac.th",
        phone: "053-943507 # 201",
        education: [
          "B.A. (Sociology), Kasetsart University, 1989",
          "M.A. (Anthropology), University of Hawaii, USA, 2003",
          "Ph.D. (Anthropology), University of Texas at Austin, USA, 2008",
        ],
        expertise: [
          "ชาติพันธุ์สัมพันธ์ (Ethnic Relations)",
          "กลุ่มชาติพันธุ์ข้ามชาติ (Transnational Migration)",
          "ชายแดนศึกษา (Border Studies)",
          "มานุษยวิทยาทัศนา (Visual Anthropology)",
          "วัฒนธรรมสมัยนิยมในอาเซียน (Southeast Asian Popular Culture)",
        ],
        publications: [
          "B.A. (Sociology), Kasetsart University, 1989",
          "M.A. (Anthropology), University of Hawaii, USA, 2003",
          "Ph.D. (Anthropology), University of Texas at Austin, USA, 2008",
        ],
      }
    : {}),
}));

export const RESEARCHER_FILTERS = [
  { id: "all", label: "ทั้งหมด", active: true },
  { id: "geo", label: "ภาควิชาภูมิศาสตร์ (15)", active: false },
  { id: "soc", label: "ภาควิชาสังคมวิทยาและมานุษยวิทยา (15)", active: false },
  { id: "dev", label: "ภาควิชาสังคมศาสตร์กับการพัฒนา (15)", active: false },
  { id: "women", label: "ภาควิชาสตรีศึกษา (4)", active: false },
] as const;

export function getResearcherById(id: string): ResearcherItem | undefined {
  return RESEARCHER_ITEMS.find((item) => item.id === id);
}
