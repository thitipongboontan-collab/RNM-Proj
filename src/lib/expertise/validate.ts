import { evidenceIndex } from "@/lib/expertise/engine";
import type {
  EvidenceSourceKind,
  ExpertiseEvidence,
  ExpertiseProfile,
  ExpertiseTopic,
} from "@/lib/expertise/types";

type AiTopic = {
  topic?: unknown;
  kind?: unknown;
  evidence_ids?: unknown;
  rationale?: unknown;
};

type AiFacet = {
  label?: unknown;
  evidence_ids?: unknown;
};

type AiPayload = {
  topics?: unknown;
  research_methods?: unknown;
  geographical_focus?: unknown;
  target_populations?: unknown;
  research_domains?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseAiPayload(raw: string): AiPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function cleanTopic(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function evidenceFromIds(ids: unknown, index: Map<string, ExpertiseEvidence>): ExpertiseEvidence[] {
  if (!Array.isArray(ids)) return [];
  const items: ExpertiseEvidence[] = [];
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const item = index.get(id);
    if (item) items.push(item);
  }
  return items;
}

function rationaleIsGrounded(rationale: string, evidence: ExpertiseEvidence[]): boolean {
  if (!rationale) return false;
  const quoted = [...rationale.matchAll(/"([^"]{8,})"/g)].map((match) => match[1].toLowerCase());
  return quoted.every((quote) =>
    evidence.some((item) => item.label.toLowerCase().includes(quote)),
  );
}

function kinds(items: ExpertiseEvidence[]): EvidenceSourceKind[] {
  return [...new Set(items.map((item) => item.source))];
}

export function applyAiNormalization(
  profile: ExpertiseProfile,
  payload: AiPayload | null,
  modelVersion: string,
): ExpertiseProfile {
  if (!payload) return profile;
  const index = evidenceIndex(profile);
  const original = [
    ...profile.expertise_profile.primary_expertise,
    ...profile.expertise_profile.secondary_expertise,
  ];
  const topics = Array.isArray(payload.topics) ? (payload.topics as AiTopic[]) : [];
  const used = new Set<string>();
  const primary: ExpertiseTopic[] = [];
  const secondary: ExpertiseTopic[] = [];

  for (const entry of topics) {
    const topic = cleanTopic(entry.topic);
    const evidence = evidenceFromIds(entry.evidence_ids, index);
    if (!topic || evidence.length < 2) continue;
    const key = topic.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const originalTopic = original.find((item) =>
      evidence.every((piece) => item.evidence.some((existing) => existing.id === piece.id)),
    );
    const base = originalTopic ?? original.find((item) => item.topic.toLowerCase() === key);
    if (!base) continue;
    const modelRationale = typeof entry.rationale === "string" ? entry.rationale.trim() : "";
    const next: ExpertiseTopic = {
      ...base,
      topic,
      evidence,
      evidence_count: evidence.length,
      evidence_sources: kinds(evidence),
      rationale: rationaleIsGrounded(modelRationale, evidence) ? modelRationale : base.rationale,
    };
    const requestedPrimary = entry.kind === "primary";
    if (requestedPrimary && base.strength !== "insufficient" && primary.length < 4) {
      primary.push(next);
    } else if (secondary.length < 6) {
      secondary.push(next);
    }
  }

  if (!primary.length && !secondary.length) return profile;

  for (const item of original) {
    const covered = [...primary, ...secondary].some((topic) =>
      item.evidence.some((evidence) => topic.evidence.some((kept) => kept.id === evidence.id)),
    );
    if (covered) continue;
    if (item.strength === "insufficient") continue;
    if (primary.length < 4 && profile.expertise_profile.primary_expertise.includes(item)) {
      primary.push(item);
    } else if (secondary.length < 6) {
      secondary.push(item);
    }
  }

  return {
    ...profile,
    expertise_profile: {
      ...profile.expertise_profile,
      primary_expertise: primary,
      secondary_expertise: secondary,
      research_methods: mergeFacet(
        profile.expertise_profile.research_methods,
        payload.research_methods,
        index,
      ),
      geographical_focus: mergeFacet(
        profile.expertise_profile.geographical_focus,
        payload.geographical_focus,
        index,
      ),
      target_populations: mergeFacet(
        profile.expertise_profile.target_populations,
        payload.target_populations,
        index,
      ),
      research_domains: mergeFacet(
        profile.expertise_profile.research_domains,
        payload.research_domains,
        index,
        true,
      ),
    },
    model_version: modelVersion,
  };
}

function mergeFacet(
  existing: string[],
  incoming: unknown,
  index: Map<string, ExpertiseEvidence>,
  keepExistingWithoutEvidence = false,
): string[] {
  const labels = [...existing];
  if (!Array.isArray(incoming)) return labels;
  for (const entry of incoming as AiFacet[]) {
    const label = cleanTopic(entry.label);
    const evidence = evidenceFromIds(entry.evidence_ids, index);
    if (!label || (!evidence.length && !keepExistingWithoutEvidence)) continue;
    if (labels.some((item) => item.toLowerCase() === label.toLowerCase())) continue;
    if (evidence.length || existing.some((item) => item.toLowerCase() === label.toLowerCase())) {
      labels.push(label);
    }
  }
  return labels.slice(0, 8);
}

export function profileFromAdminEdit(
  current: ExpertiseProfile,
  input: {
    primary: string[];
    secondary: string[];
    methods: string[];
    geography: string[];
    populations: string[];
    domains: string[];
  },
): ExpertiseProfile {
  const known = [
    ...current.expertise_profile.primary_expertise,
    ...current.expertise_profile.secondary_expertise,
  ];

  function toTopic(label: string, primary: boolean): ExpertiseTopic {
    const match = known.find((item) => item.topic.toLowerCase() === label.toLowerCase());
    if (match) {
      return {
        ...match,
        topic: label,
        rationale: primary ? match.rationale : match.rationale,
      };
    }
    return {
      topic: label,
      confidence: 1,
      evidence_count: 1,
      evidence_sources: ["research_interest"],
      strength: "strong",
      rationale: "ยืนยันหรือแก้ไขโดยผู้ดูแลระบบ และจะไม่ถูกทับด้วยการวิเคราะห์รอบถัดไปจนกว่าจะมีการตรวจทาน",
      evidence: [
        {
          id: `admin:${label.toLowerCase()}`,
          source: "research_interest",
          label: "Admin review",
        },
      ],
    };
  }

  return {
    ...current,
    expertise_profile: {
      primary_expertise: input.primary.map((label) => toTopic(label, true)),
      secondary_expertise: input.secondary.map((label) => toTopic(label, false)),
      research_methods: input.methods,
      geographical_focus: input.geography,
      target_populations: input.populations,
      research_domains: input.domains,
    },
  };
}
