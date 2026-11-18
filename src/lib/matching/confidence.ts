import type { EvidenceConfidence, FundingRelevance, MatchingProfileRecord } from "@/lib/matching/types";

export function assessEvidenceConfidence(
  matchingProfile: MatchingProfileRecord,
  relevance: FundingRelevance,
): EvidenceConfidence {
  const matchedTopicCount = relevance.evidence.filter(
    (item) => item.kind === "primary_topic" || item.kind === "secondary_topic",
  ).length;
  const matchedOutputCount = relevance.evidence.filter(
    (item) => item.kind === "publication" || item.kind === "project",
  ).length;
  const titleFallback =
    matchingProfile.analysisStatus === "insufficient_evidence" ||
    matchingProfile.analysisStatus === "missing" ||
    !matchingProfile.profile;

  if (titleFallback) {
    if (matchedOutputCount > 0) {
      return {
        score: Number(Math.min(0.4, 0.12 + matchedOutputCount / 12).toFixed(2)),
        kind: "evidence_strength",
        source: "titles_only",
        summary:
          matchingProfile.analysisStatus === "insufficient_evidence"
            ? "จับคู่จากชื่อผลงาน/โครงการ เพราะโปรไฟล์ความเชี่ยวชาญมีหลักฐานไม่พอ ค่านี้ไม่ใช่โอกาสได้รับทุน"
            : "ใช้เฉพาะชื่อผลงานและโครงการ เพราะยังไม่มีโปรไฟล์ความเชี่ยวชาญที่วิเคราะห์แล้ว",
      };
    }
    return {
      score: 0.05,
      kind: "evidence_strength",
      source: "insufficient_profile",
      summary:
        "โปรไฟล์ความเชี่ยวชาญมีหลักฐานไม่พอ และยังไม่มีชื่อผลงาน/โครงการที่ตรงกับประกาศ ความมั่นใจนี้วัดความหนาของหลักฐาน ไม่ใช่โอกาสได้รับทุน",
    };
  }

  const profile = matchingProfile.profile;
  const topicConfidences = [
    ...(profile?.expertise_profile.primary_expertise ?? []),
    ...(profile?.expertise_profile.secondary_expertise ?? []),
  ]
    .filter((topic) =>
      relevance.evidence.some((item) => item.kind.endsWith("topic") && item.label === topic.topic),
    )
    .map((topic) => topic.confidence);

  const fallback =
    profile?.expertise_profile.primary_expertise[0]?.confidence ??
    (matchedOutputCount > 0 ? Math.min(0.55, 0.2 + matchedOutputCount / 12) : 0.2);
  const raw = topicConfidences.length
    ? topicConfidences.reduce((sum, value) => sum + value, 0) / topicConfidences.length
    : fallback;
  const score = Number(Math.min(0.97, raw).toFixed(2));

  return {
    score,
    kind: "evidence_strength",
    source: matchingProfile.verified ? "approved_profile" : "unverified_profile",
    summary: matchingProfile.verified
      ? `ใช้โปรไฟล์ที่แอดมินล็อกแล้ว (${matchedTopicCount} หัวข้อที่ตรง, ${matchedOutputCount} ผลงาน/โครงการ)`
      : `ใช้โปรไฟล์ที่ยังไม่ถูกล็อก (${matchedTopicCount} หัวข้อที่ตรง, ${matchedOutputCount} ผลงาน/โครงการ) ค่านี้ไม่ใช่ความน่าจะเป็นของการจับคู่`,
  };
}
