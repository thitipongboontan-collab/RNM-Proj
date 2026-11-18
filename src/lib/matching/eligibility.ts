import { extractAcademicTitle } from "@/lib/ai/researcher-meta";
import type { FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { getFundingCallText } from "@/lib/matching/call-text";
import { extractEligibilityRequirements } from "@/lib/matching/funding-text";
import { isSparseCallDetails } from "@/lib/matching/terms";
import type { EligibilityAssessment } from "@/lib/matching/types";

function isFacultyTitle(title: string | null): boolean {
  return Boolean(title && /(ศ\.ดร\.|รศ\.ดร\.|ผศ\.ดร\.|อาจารย์)/.test(title));
}

const STUDENT_APPLICANT =
  /(นักศึกษาระดับมหาบัณฑิต|นักศึกษาระดับปริญญา|นักศึกษาระดับ\s*ป\.|หลักสูตรทำวิทยานิพนธ์|หากเรียนจบแล้วไม่สามารถสมัคร)/;
const FACULTY_APPLICANT = /(คณาจารย์|อาจารย์รุ่นเยาว์|อาจารย์และนักวิจัย)/;
const ADVISOR_ONLY = /อาจารย์ที่ปรึกษา/;
const DOCTORAL_CONSTRAINT = /(จบ ป\.เอก มาไม่เกิน|กำลังศึกษา ป\.เอก|postdoctoral|ป\.เอก)/i;

export function assessEligibility(
  researcher: ResearcherRecord,
  funding: FundingRecord,
): EligibilityAssessment {
  const details = getFundingCallText(funding);
  const requirements = extractEligibilityRequirements(details, funding.row.title);
  const facts: string[] = [];
  const title = extractAcademicTitle(researcher.row.name_th);
  if (title) facts.push(`ตำแหน่งจากชื่อ: ${title}`);
  facts.push(`ภาควิชา: ${researcher.row.department}`);

  if (isSparseCallDetails(details)) {
    return {
      status: "insufficient_call_data",
      summary: "ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์",
      quotedRequirements: [],
      researcherFactsUsed: facts,
      reviewReasons: ["รายละเอียดประกาศว่างหรือสั้นเกินกว่าจะอ่านคุณสมบัติได้"],
    };
  }

  if (!requirements.length) {
    return {
      status: "unknown",
      summary:
        "ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์",
      quotedRequirements: [],
      researcherFactsUsed: facts,
      reviewReasons: [],
    };
  }

  const blob = requirements.join(" ");
  const faculty = isFacultyTitle(title);
  const studentRequirement = STUDENT_APPLICANT.test(blob);
  const facultyRequirement = FACULTY_APPLICANT.test(blob) && !onlyAdvisorMention(blob);
  const doctoralConstraint = DOCTORAL_CONSTRAINT.test(blob);

  if (studentRequirement && facultyRequirement) {
    return {
      status: "needs_review",
      summary: "ประกาศระบุทั้งนักศึกษาและคณาจารย์ในข้อความคุณสมบัติ จึงต้องให้คนตรวจ ไม่สรุปจากความสอดคล้องของงานวิจัย",
      quotedRequirements: requirements,
      researcherFactsUsed: facts,
      reviewReasons: ["คุณสมบัติผู้สมัครในประกาศคลุมเครือหรือขัดกันระหว่างนักศึกษาและคณาจารย์"],
    };
  }

  if (studentRequirement && faculty) {
    return {
      status: "likely_ineligible",
      summary: "ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์",
      quotedRequirements: requirements,
      researcherFactsUsed: facts,
      reviewReasons: [],
    };
  }

  if (facultyRequirement && faculty) {
    return {
      status: "likely_eligible",
      summary: /สังคมศาสตร์|humanities|social sciences/i.test(`${researcher.row.department} ${blob}`)
        ? "ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี"
        : "ประกาศรับคณาจารย์ ซึ่งสอดคล้องกับตำแหน่งในรายชื่อ",
      quotedRequirements: requirements,
      researcherFactsUsed: facts,
      reviewReasons: [],
    };
  }

  if (doctoralConstraint) {
    return {
      status: "unknown",
      summary: "ประกาศมีเงื่อนไขวุฒิ/อายุงานปริญญาเอก แต่ระบบไม่มีวันที่สำเร็จการศึกษา จึงไม่สรุปสิทธิ์",
      quotedRequirements: requirements,
      researcherFactsUsed: facts,
      reviewReasons: ["ไม่มีวันที่สำเร็จการศึกษาหรือประเภทการจ้างในฐานข้อมูลนักวิจัย"],
    };
  }

  return {
    status: "unknown",
    summary: "มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์",
    quotedRequirements: requirements,
    researcherFactsUsed: facts,
    reviewReasons: [],
  };
}

function onlyAdvisorMention(blob: string): boolean {
  return ADVISOR_ONLY.test(blob) && !/(คณาจารย์|อาจารย์รุ่นเยาว์|อาจารย์และนักวิจัย)/.test(blob);
}
