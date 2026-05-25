export type FundingAttachment = {
  id: string;
  fileName: string;
  type: "doc" | "pdf";
};

export type FundingDetailContent = {
  fullTitle: string;
  organization: string;
  publishedDate: string;
  bodySections: string[];
  bulletGroups?: { title?: string; items: string[] }[];
  numberedList?: { title: string; items: string[] };
  closingNote?: string;
  downloadLabel: string;
  attachments: FundingAttachment[];
  nriisUrl: string;
  nrctUrl: string;
};

export type FundingItem = {
  id: string;
  title: string;
  organization: string;
  openDate: string;
  closeDate: string;
  publishedDate: string;
  imageVariant: 1 | 2 | 3;
  statusLabel: string;
  detail: FundingDetailContent;
};

const FUNDING_TITLE =
  "วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570...";

const DETAIL_TITLE =
  "วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 (ด้านการพัฒนาเทคโนโลยีและอุตสาหกรรม)";

const DETAIL_BODY_SECTIONS = [
  "ด้วย สำนักงานการวิจัยแห่งชาติ (วช.) กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรมเป็นหน่วยงานหลักในการบริหารทุนวิจัยและนวัตกรรมของประเทศ โดยมุ่งเน้นผลสำเร็จจากการวิจัยที่สามารถนำไปใช้ประโยชน์ในมิติต่าง ๆ ทั้งมิติด้านวิชาการ ด้านเศรษฐกิจ ด้านสังคมและชุมชน และด้านนโยบาย เพื่อใช้เป็นกลไกในการพัฒนาและแก้ปัญหาเร่งด่วนสำคัญของประเทศ เพื่อให้บรรลุเป้าหมายการพัฒนาที่ยั่งยืน โดยมุ่งเน้นผลสัมฤทธิ์ที่สำคัญของแผนด้านวิทยาศาสตร์ วิจัยและนวัตกรรมของประเทศ พ.ศ. 2566-2570 ทั้งนี้ เพื่อให้การบริหารทุนวิจัยและนวัตกรรมของ วช. เป็นไปตามเป้าประสงค์ของยุทธศาสตร์ จึงได้กำหนดกรอบการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 เพื่อเปิดรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 ด้านการพัฒนาเทคโนโลยีและอุตสาหกรรม ดังนี้",
  "ยุทธศาสตร์ที่ 2 การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไขปัญหาท้าทาย และปรับตัวได้ทันต่อพลวัตการเปลี่ยนแปลงของโลก โดยใช้วิทยาศาสตร์การวิจัยและนวัตกรรม",
  "แผนงาน P11 ขจัดความยากจนและลดความเหลื่อมล้ำ โดยการเพิ่มโอกาส และยกระดับการพัฒนาเศรษฐกิจฐานรากในพื้นที่",
  "แผนงานย่อย F10 (S2P11): เพิ่มความเข้มแข็งของเศรษฐกิจฐานรากในพื้นที่ให้พึ่งพาตนเองได้และมีการกระจายรายได้สู่ชุมชน/ท้องถิ่นมากขึ้น",
  "แผนงานย่อยรายประเด็น: แผนงานยกระดับคุณภาพสังคมด้วยเทคโนโลยีและการวิจัย",
];

const DETAIL_BULLETS = {
  items: [
    "กลุ่มเรื่อง การพัฒนาวัสดุขั้นสูงเพื่ออุตสาหกรรม",
    "กลุ่มเรื่อง อุตสาหกรรมฐานชีวภาพและความยั่งยืน",
    "กลุ่มเรื่อง การพัฒนาผลิตภัณฑ์อาหารและผลิตภัณฑ์ที่เกี่ยวข้องเพื่อเพิ่มมูลค่าและยกระดับการตลาด",
    "กลุ่มเรื่อง ดิจิทัล ปัญญาประดิษฐ์ ระบบอัตโนมัติ และหุ่นยนต์",
  ],
};

const DETAIL_NUMBERED = {
  title: "การเปิดรับข้อเสนอการวิจัยและนวัตกรรม",
  items: [
    "วช. เปิดรับข้อเสนอการวิจัยและนวัตกรรม ตั้งแต่วันที่ 21 พฤษภาคม 2569 - 21 กรกฎาคม 2569 ภายในเวลา 16.30 น.",
    "นักวิจัยและผู้ร่วมวิจัยทุกคน ต้องยืนยันการเข้าร่วมการทำวิจัยในระบบ NRIIS ภายในวันที่ 21 กรกฎาคม 2569 เวลา 16.30 น.",
    "หน่วยงานต้นสังกัดของนักวิจัย ต้องรับรองข้อเสนอการวิจัยและนวัตกรรม ในระบบ NRIIS ภายในวันที่ 30 กรกฎาคม 2569 เวลา 16.30 น.",
  ],
};

const DEFAULT_ATTACHMENTS: FundingAttachment[] = [
  { id: "doc-1", fileName: "new.doc", type: "doc" },
  { id: "pdf-1", fileName: "news.pdf", type: "pdf" },
  { id: "pdf-2", fileName: "news.pdf", type: "pdf" },
];

function createFunding(id: string, imageVariant: 1 | 2 | 3): FundingItem {
  return {
    id,
    title: FUNDING_TITLE,
    organization: "สำนักงานการวิจัยแห่งชาติ",
    openDate: "เปิดรับวันที่ 20 พ.ค 2569",
    closeDate: "ปิดรับวันที่ 20 ก.ค 2569",
    publishedDate: "18 พฤษภาคม 2569",
    imageVariant,
    statusLabel: "ทุนวิจัยที่เปิดรับ",
    detail: {
      fullTitle: DETAIL_TITLE,
      organization: "สำนักงานการวิจัยแห่งชาติ",
      publishedDate: "14 พฤษภาคม 2569",
      bodySections: DETAIL_BODY_SECTIONS,
      bulletGroups: [DETAIL_BULLETS],
      numberedList: DETAIL_NUMBERED,
      closingNote:
        "วช. จะประกาศผลการพิจารณาข้อเสนอการวิจัยและนวัตกรรมที่ผ่านการพิจารณาเบื้องต้นทางเว็บไซต์ www.nrct.go.th และ https://nriis.go.th",
      downloadLabel: "ดาวน์โหลดไฟล์ที่เกี่ยวข้อง",
      attachments: DEFAULT_ATTACHMENTS,
      nriisUrl: "https://nriis.go.th",
      nrctUrl: "https://www.nrct.go.th/home",
    },
  };
}

export const FUNDING_ITEMS: FundingItem[] = [
  createFunding("nrct-2570-1", 1),
  createFunding("nrct-2570-2", 2),
  createFunding("nrct-2570-3", 3),
  createFunding("nrct-2570-4", 1),
  createFunding("nrct-2570-5", 2),
  createFunding("nrct-2570-6", 3),
];

export function getFundingById(id: string): FundingItem | undefined {
  return FUNDING_ITEMS.find((item) => item.id === id);
}

export function getFundingIndex(id: string): number {
  return FUNDING_ITEMS.findIndex((item) => item.id === id);
}

export const HERO_GRADIENT: Record<FundingItem["imageVariant"], string> = {
  1: "linear-gradient(135deg, #4D5CAD 0%, #6B8FD4 100%)",
  2: "linear-gradient(135deg, #12B2C5 0%, #4D5CAD 100%)",
  3: "linear-gradient(135deg, #00CACC 0%, #4765B0 100%)",
};
