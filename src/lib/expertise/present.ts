import type { ExpertiseProfile } from "@/lib/expertise/types";

export type ExpertiseTopicView = {
  topic: string;
  confidence: number;
  evidenceCount: number;
  sources: string[];
  strength: string;
  rationale: string;
  evidence: Array<{ id: string; source: string; label: string }>;
};

export type ExpertiseProfileView = {
  status: string;
  analyzedAt: string | null;
  modelVersion: string | null;
  confidenceMethod: string;
  primary: ExpertiseTopicView[];
  secondary: ExpertiseTopicView[];
  methods: string[];
  geography: string[];
  populations: string[];
  domains: string[];
  summary: {
    publications: number;
    projects: number;
    interests: number;
    duplicates: number;
  };
};

const SOURCE_LABELS: Record<string, string> = {
  publication: "ผลงานตีพิมพ์",
  research_project: "โครงการวิจัย",
  research_interest: "ความเชี่ยวชาญที่บันทึกไว้",
  keyword: "คำสำคัญ",
  academic_background: "ประวัติการศึกษา",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function isExpertiseProfile(value: unknown): value is ExpertiseProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as ExpertiseProfile;
  return Array.isArray(profile.expertise_profile?.primary_expertise);
}

export function presentExpertiseProfile(profile: ExpertiseProfile): ExpertiseProfileView {
  const toView = (topic: ExpertiseProfile["expertise_profile"]["primary_expertise"][number]): ExpertiseTopicView => ({
    topic: topic.topic,
    confidence: topic.confidence,
    evidenceCount: topic.evidence_count,
    sources: topic.evidence_sources,
    strength: topic.strength,
    rationale: topic.rationale,
    evidence: topic.evidence.map((item) => ({
      id: item.id,
      source: item.source,
      label: item.label,
    })),
  });

  return {
    status: profile.analysis_status,
    analyzedAt: profile.last_analyzed_at,
    modelVersion: profile.model_version,
    confidenceMethod: profile.confidence_method,
    primary: profile.expertise_profile.primary_expertise.map(toView),
    secondary: profile.expertise_profile.secondary_expertise.map(toView),
    methods: profile.expertise_profile.research_methods,
    geography: profile.expertise_profile.geographical_focus,
    populations: profile.expertise_profile.target_populations,
    domains: profile.expertise_profile.research_domains,
    summary: {
      publications: profile.evidence_summary.total_publications_analyzed,
      projects: profile.evidence_summary.total_projects_analyzed,
      interests: profile.evidence_summary.total_research_interests,
      duplicates: profile.evidence_summary.duplicate_publications_collapsed,
    },
  };
}

export function formatExpertiseBrief(profile: ExpertiseProfile): string {
  const view = presentExpertiseProfile(profile);
  const line = (label: string, values: string[]) =>
    values.length ? `    ${label}: ${values.join(", ")}` : null;

  return [
    "  โปรไฟล์ความเชี่ยวชาญจากหลักฐาน (ใช้ส่วนนี้เป็นหลักเมื่อตอบเรื่องความเชี่ยวชาญ ห้ามยกคำสำคัญที่ปรากฏครั้งเดียวขึ้นเป็นความเชี่ยวชาญ):",
    `    สถานะ: ${view.status} | model: ${view.modelVersion ?? "—"} | confidence method: ${view.confidenceMethod}`,
    line(
      "Primary",
      view.primary.map((item) => `${item.topic} (${item.confidence}, ${item.evidenceCount} evidence)`),
    ),
    line(
      "Secondary",
      view.secondary.map((item) => `${item.topic} (${item.confidence}, ${item.evidenceCount} evidence)`),
    ),
    line("Methods", view.methods),
    line("Geography", view.geography),
    line("Populations", view.populations),
    line("Domains", view.domains),
  ]
    .filter(Boolean)
    .join("\n");
}
