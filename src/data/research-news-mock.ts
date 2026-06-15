import type { ResearchNewsDetail } from "@/data/research-news";
import { getResearchNewsGradient } from "@/data/research-news";

export const RESEARCH_NEWS_MOCK: ResearchNewsDetail[] = [
  {
    id: "news-1",
    category: "ข่าวอุตสาหกรรม",
    title: 'สถานการณ์อุตสาหกรรม "โรงงาน EV Battery" ไทยตอบโจทย...',
    publishedDate: "13 พ.ค. 2569",
    views: 47,
    imageGradient: getResearchNewsGradient(0),
    details:
      "สถานการณ์อุตสาหกรรม EV Battery ในประเทศไทยมีแนวโน้มขยายตัวอย่างต่อเนื่อง จากการลงทุนของผู้ผลิตรายใหญ่และนโยบายสนับสนุนจากภาครัฐ โดยเน้นการพัฒนาโซ่ Supply Chain ภายในประเทศและการสร้างบุคลากรด้านเทคโนโลยีแบตเตอรี่",
  },
  {
    id: "news-2",
    category: "รายงานสถิติ",
    title: "รายงานสถิติอาเซียน 2025 สถานการณ์เศรษฐกิจและสังค...",
    publishedDate: "12 พ.ค. 2568",
    views: 30,
    imageGradient: getResearchNewsGradient(1),
    details:
      "รายงานสถิติอาเซียน 2025 สรุปภาพรวมเศรษฐกิจและสังคมของกลุ่มประเทศอาเซียน ครอบคลุมตัวชี้วัดการค้า การลงทุน การจ้างงาน และแนวโน้มความร่วมมือด้านวิจัยและพัฒนาในระดับภูมิภาค",
  },
  {
    id: "news-3",
    category: "รายงาน",
    title: "National AI Policy Framework Thailand",
    publishedDate: "29 ม.ค. 2567",
    views: 40,
    imageGradient: getResearchNewsGradient(2),
    details:
      "กรอบนโยบายปัญญาประดิษฐ์แห่งชาติของไทย กำหนดทิศทางการพัฒนาและใช้งาน AI อย่างมีจริยธรรม ครอบคลุมการส่งเสริมการวิจัย การพัฒนาบุคลากร และการสร้างระบบนิเวศนวัตกรรมที่ยั่งยืน",
  },
  {
    id: "news-4",
    category: "ประกาศ",
    title: "ประกวดรายงานสถิติ ประจำปี 2568",
    publishedDate: "17 ก.พ. 2567",
    views: 50,
    imageGradient: getResearchNewsGradient(3),
    details:
      "เปิดรับส่งผลงานรายงานสถิติประจำปี 2568 สำหรับหน่วยงานวิจัยและนักวิชาการ โดยเน้นการนำเสนอข้อมูลเชิงลึกที่สามารถนำไปใช้ประกอบการตัดสินใจเชิงนโยบายได้",
  },
];

export function getMockResearchNewsById(id: string): ResearchNewsDetail | null {
  return RESEARCH_NEWS_MOCK.find((item) => item.id === id) ?? null;
}
