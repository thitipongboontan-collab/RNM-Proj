import type { FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { getFundingCallText } from "@/lib/matching/call-text";
import { extractFundingTopicLines } from "@/lib/matching/funding-text";
import {
  cappedContribution,
  isGenericGeographyLabel,
  isHostCityLabel,
  isSparseCallDetails,
  labelHits,
} from "@/lib/matching/terms";
import type { FundingRelevance, MatchEvidence, MatchingProfileRecord, RelevanceBasis } from "@/lib/matching/types";

const WEIGHTS = {
  primaryTopic: 18,
  secondaryTopic: 10,
  method: 6,
  geography: 6,
  population: 8,
  domain: 6,
  publicationOnTopicLine: 7,
  publicationDistinctive: 5,
  projectOnTopicLine: 8,
  projectDistinctive: 6,
  publicationCap: 28,
  projectCap: 24,
  sparseCallCap: 40,
} as const;

function uniqueEvidence(items: MatchEvidence[]): MatchEvidence[] {
  const seen = new Set<string>();
  const result: MatchEvidence[] = [];
  for (const item of items) {
    const key = `${item.kind}:${item.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function shouldUseExpertiseTopics(matchingProfile: MatchingProfileRecord): boolean {
  if (!matchingProfile.profile) return false;
  if (matchingProfile.analysisStatus === "insufficient_evidence") return false;
  if (matchingProfile.analysisStatus === "rejected") return false;
  return true;
}

export function assessFundingRelevance(
  researcher: ResearcherRecord,
  funding: FundingRecord,
  matchingProfile: MatchingProfileRecord,
): FundingRelevance {
  const callText = getFundingCallText(funding);
  const sparseCall = isSparseCallDetails(callText);
  const topicLines = extractFundingTopicLines(callText, funding.row.title).join(" ");
  const fundingBlob = sparseCall
    ? [funding.row.title, funding.row.organization].join(" ")
    : [funding.row.title, funding.row.organization, callText, topicLines].join(" ");

  const evidence: MatchEvidence[] = [];
  const matchedTerms = new Set<string>();
  const publicationWeights: number[] = [];
  const projectWeights: number[] = [];
  let topicScore = 0;
  let expertiseHits = 0;

  const profile = shouldUseExpertiseTopics(matchingProfile)
    ? matchingProfile.profile?.expertise_profile
    : undefined;

  const addHits = (
    labels: string[],
    kind: MatchEvidence["kind"],
    weight: number,
    skipLabel?: (label: string) => boolean,
  ) => {
    for (const label of labels) {
      if (skipLabel?.(label)) continue;
      const hits = labelHits(fundingBlob, label);
      if (!hits.length) continue;
      topicScore += weight;
      expertiseHits += 1;
      hits.forEach((hit) => matchedTerms.add(hit));
      evidence.push({ id: `${kind}:${label}`, kind, label });
    }
  };

  if (profile) {
    addHits(
      profile.primary_expertise.map((item) => item.topic),
      "primary_topic",
      WEIGHTS.primaryTopic,
    );
    addHits(
      profile.secondary_expertise.map((item) => item.topic),
      "secondary_topic",
      WEIGHTS.secondaryTopic,
    );
    addHits(profile.research_methods, "method", WEIGHTS.method);
    addHits(
      profile.geographical_focus,
      "geography",
      WEIGHTS.geography,
      (label) =>
        isGenericGeographyLabel(label) ||
        isHostCityLabel(label, funding.row.organization, funding.row.title),
    );
    addHits(profile.target_populations, "population", WEIGHTS.population);
    addHits(profile.research_domains, "domain", WEIGHTS.domain);
  }

  for (const publication of researcher.publications) {
    const topicHits = labelHits(topicLines, publication.title);
    const titleHits = labelHits(`${funding.row.title} ${funding.row.organization}`, publication.title);
    const hits = topicHits.length ? topicHits : titleHits;
    const weight = topicHits.length
      ? WEIGHTS.publicationOnTopicLine
      : titleHits.length >= 2
        ? WEIGHTS.publicationDistinctive
        : 0;
    if (!weight) continue;
    publicationWeights.push(weight);
    hits.forEach((hit) => matchedTerms.add(hit));
    evidence.push({
      id: `publication:${publication.title}`,
      kind: "publication",
      label: publication.year ? `${publication.title} (${publication.year})` : publication.title,
    });
  }

  for (const project of researcher.projects ?? []) {
    const topicHits = labelHits(topicLines, project.project_name);
    const titleHits = labelHits(`${funding.row.title} ${funding.row.organization}`, project.project_name);
    const hits = topicHits.length ? topicHits : titleHits;
    const weight = topicHits.length
      ? WEIGHTS.projectOnTopicLine
      : titleHits.length >= 2
        ? WEIGHTS.projectDistinctive
        : 0;
    if (!weight) continue;
    projectWeights.push(weight);
    hits.forEach((hit) => matchedTerms.add(hit));
    evidence.push({
      id: `project:${project.project_name}`,
      kind: "project",
      label: project.project_name,
    });
  }

  let score =
    topicScore +
    cappedContribution(publicationWeights, WEIGHTS.publicationCap) +
    cappedContribution(projectWeights, WEIGHTS.projectCap);

  if (sparseCall) {
    score = Math.min(WEIGHTS.sparseCallCap, score);
  }

  const unique = uniqueEvidence(evidence).slice(0, 12);
  const titleEvidence = unique.some((item) => item.kind === "publication" || item.kind === "project");
  let basis: RelevanceBasis = "none";
  if (expertiseHits > 0) basis = "expertise";
  else if (titleEvidence) basis = sparseCall ? "sparse_call_title" : "titles";
  else if (sparseCall) basis = "sparse_call_title";

  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  const summary = buildSummary(bounded, unique.length, basis, matchingProfile);

  return {
    score: bounded,
    summary,
    basis,
    matchedTerms: [...matchedTerms].slice(0, 12),
    evidence: unique,
  };
}

function buildSummary(
  score: number,
  evidenceCount: number,
  basis: RelevanceBasis,
  matchingProfile: MatchingProfileRecord,
): string {
  if (!evidenceCount) {
    return basis === "sparse_call_title"
      ? "ประกาศมีรายละเอียดน้อย จึงประเมินจากชื่อทุนเท่านั้น และยังไม่พบคำที่ตรงกับผลงาน"
      : "ไม่พบหัวข้อหรือชื่อผลงานที่สอดคล้องกับประกาศทุนโดยตรง";
  }
  if (basis === "sparse_call_title") {
    return `ประเมินจากชื่อทุนเท่านั้น เพราะรายละเอียดประกาศไม่พอ (หลักฐาน ${evidenceCount} รายการ)`;
  }
  if (basis === "titles" || matchingProfile.analysisStatus === "insufficient_evidence") {
    return `จับคู่จากชื่อผลงานหรือโครงการ ${evidenceCount} รายการ ไม่ใช่จากความเชี่ยวชาญที่ตรวจแล้ว`;
  }
  return score
    ? `พบหลักฐานที่สอดคล้องกับกรอบทุน ${evidenceCount} รายการ`
    : "ไม่พบหัวข้อหรือชื่อผลงานที่สอดคล้องกับประกาศทุนโดยตรง";
}

export const RELEVANCE_WEIGHTS = WEIGHTS;
