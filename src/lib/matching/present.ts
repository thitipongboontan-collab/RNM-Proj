import type {
  EligibilityStatus,
  EvidenceConfidence,
  ExpertiseFundingMatch,
  RelevanceBasis,
  ResearcherFundingMatch,
} from "@/lib/matching/types";

export const ELIGIBILITY_STATUS_LABEL: Record<EligibilityStatus, string> = {
  likely_eligible: "น่าจะมีสิทธิ์สมัคร",
  likely_ineligible: "น่าจะไม่มีสิทธิ์ตามประกาศ",
  unknown: "ยังสรุปสิทธิ์ไม่ได้",
  insufficient_call_data: "ประกาศไม่มีข้อมูลคุณสมบัติ",
  needs_review: "ต้องให้คนตรวจคุณสมบัติ",
};

export const CONFIDENCE_SOURCE_LABEL: Record<EvidenceConfidence["source"], string> = {
  approved_profile: "โปรไฟล์ที่แอดมินล็อก",
  unverified_profile: "โปรไฟล์ที่ยังไม่ล็อก",
  titles_only: "ใช้เฉพาะชื่อผลงาน",
  insufficient_profile: "หลักฐานในโปรไฟล์ไม่พอ",
};

export const RELEVANCE_BASIS_LABEL: Record<RelevanceBasis, string> = {
  expertise: "จับคู่จากความเชี่ยวชาญที่วิเคราะห์แล้ว",
  titles: "จับคู่จากชื่อผลงานหรือโครงการ",
  sparse_call_title: "ประเมินจากชื่อทุน เพราะรายละเอียดประกาศไม่พอ",
  none: "ยังไม่พบหลักฐานที่ตรงกับประกาศ",
};

export function formatExpertiseFundingMatchBlock(matches: ExpertiseFundingMatch[]): string {
  if (!matches.length) return "- ไม่มีผลการประเมินเชิงหลักฐาน";

  return matches
    .map((item) =>
      [
        `[${item.fundingId}] ${item.title}`,
        `  Funding Relevance: ${item.relevance.score}/100 (${item.relevance.basis}) — ${item.relevance.summary}`,
        `  Evidence Confidence: ${item.evidenceConfidence.score} (${item.evidenceConfidence.source}; not a match probability)`,
        `  Eligibility: ${item.eligibility.status} — ${item.eligibility.summary}`,
        item.eligibility.quotedRequirements.length
          ? `  ข้อความประกาศ: ${item.eligibility.quotedRequirements[0]}`
          : "  ข้อความประกาศ: —",
        item.eligibility.researcherFactsUsed.length
          ? `  ข้อเท็จจริงนักวิจัย: ${item.eligibility.researcherFactsUsed.join("; ")}`
          : null,
        item.eligibility.reviewReasons.length
          ? `  ให้คนตรวจ: ${item.eligibility.reviewReasons.join("; ")}`
          : null,
        item.relevance.evidence.length
          ? `  หลักฐาน: ${item.relevance.evidence
              .slice(0, 4)
              .map((evidence) => evidence.label)
              .join(" | ")}`
          : "  หลักฐาน: —",
        `  ลิงก์: /funding/${item.fundingId}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

export function formatResearcherFundingMatchBlock(matches: ResearcherFundingMatch[]): string {
  if (!matches.length) return "- ไม่มีผลการประเมินเชิงหลักฐาน";

  return matches
    .map((item) =>
      [
        `[${item.researcherId}] ${item.nameTh}`,
        `  Funding Relevance: ${item.relevance.score}/100 (${item.relevance.basis}) — ${item.relevance.summary}`,
        `  Evidence Confidence: ${item.evidenceConfidence.score} (${item.evidenceConfidence.source})`,
        `  Eligibility: ${item.eligibility.status} — ${item.eligibility.summary}`,
        item.relevance.evidence.length
          ? `  หลักฐาน: ${item.relevance.evidence
              .slice(0, 4)
              .map((evidence) => evidence.label)
              .join(" | ")}`
          : "  หลักฐาน: —",
        `  ลิงก์: /researchers/${item.researcherId}`,
      ].join("\n"),
    )
    .join("\n\n");
}
