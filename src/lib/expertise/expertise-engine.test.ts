import assert from "node:assert/strict";
import { buildExpertiseProfile } from "@/lib/expertise/engine";
import type { ExpertiseSourceRecord } from "@/lib/expertise/types";
import { applyAiNormalization } from "@/lib/expertise/validate";

function record(partial: Partial<ExpertiseSourceRecord>): ExpertiseSourceRecord {
  return {
    researcherId: "RS-TEST",
    department: "ภาควิชาสังคมวิทยาและมานุษยวิทยา",
    degrees: [],
    manualExpertise: [],
    keywords: [],
    publications: [],
    projects: [],
    ...partial,
  };
}

function titles(values: string[]) {
  return values.map((title, index) => ({ id: `P${index + 1}`, title, year: 2020 + index }));
}

const many = buildExpertiseProfile(
  record({
    researcherId: "RS-MANY",
    manualExpertise: ["Forced migration"],
    keywords: ["forced migration", "refugee protection"],
    publications: titles([
      "Forced migration and protection in Thailand",
      "Governing forced migration in Thailand",
      "Forced migration policy after displacement",
      "Cities and forced migration governance",
      "A survey of forced migration trajectories",
      "Survey of forced migration housing",
      "Qualitative study of forced migration decisions",
      "Qualitative interviews on forced migration",
    ]),
    projects: [
      { id: "J1", title: "Forced migration governance project", role: "หัวหน้าโครงการ" },
      { id: "J2", title: "Refugee protection field study", role: "ผู้ร่วมวิจัย" },
    ],
  }),
);

const few = buildExpertiseProfile(
  record({
    researcherId: "RS-FEW",
    manualExpertise: ["Urban poverty"],
    keywords: ["urban poverty"],
    publications: titles(["Urban poverty and housing in Chiang Mai", "Measuring urban poverty"]),
  }),
);

const none = buildExpertiseProfile(
  record({
    researcherId: "RS-NONE",
    manualExpertise: ["Tourism"],
    keywords: ["tourism"],
  }),
);

const broad = buildExpertiseProfile(
  record({
    researcherId: "RS-BROAD",
    manualExpertise: ["Water", "Music", "Finance", "Sport", "Tourism"],
    keywords: ["alpha", "beta", "gamma", "delta", "epsilon"],
    publications: titles([
      "Community forestry and livelihoods",
      "Community forestry institutions in Northern Thailand",
      "Rules of community forestry",
      "A note on museum lighting",
    ]),
  }),
);

const interdisciplinary = buildExpertiseProfile(
  record({
    researcherId: "RS-INTER",
    manualExpertise: ["Air pollution", "Gender and work"],
    keywords: ["air pollution", "gender and work"],
    publications: titles([
      "Air pollution exposure in Chiang Mai",
      "Household air pollution and health",
      "Seasonal air pollution in Northern Thailand",
      "Gender and work in migrant households",
      "Gender and work during displacement",
    ]),
  }),
);

const unrelated = buildExpertiseProfile(
  record({
    researcherId: "RS-UNRELATED",
    manualExpertise: ["Climate adaptation"],
    keywords: ["climate adaptation"],
    publications: titles([
      "Climate adaptation and farming households",
      "Climate adaptation policy in the Mekong",
      "Poetry and the city",
      "Museum education workshop",
    ]),
  }),
);

const incomplete = buildExpertiseProfile(
  record({
    researcherId: "RS-INCOMPLETE",
    department: "",
  }),
);

const duplicates = buildExpertiseProfile(
  record({
    researcherId: "RS-DUP",
    manualExpertise: ["Community forestry"],
    keywords: ["community forestry"],
    publications: [
      ...titles(["Community forestry and local institutions", "Community forestry and local institutions"]),
      { id: "P3", title: "Community forestry after reform", year: 2022 },
    ],
  }),
);

const manyPrimary = many.expertise_profile.primary_expertise.map((item) => item.topic.toLowerCase());
assert.ok(
  manyPrimary.some((topic) => topic.includes("forced migration")),
  "many publications should identify forced migration as primary",
);
assert.ok(
  many.expertise_profile.primary_expertise.every((topic) => topic.evidence_count >= 2),
  "primary expertise needs repeated evidence",
);
assert.ok(
  many.expertise_profile.primary_expertise.some((topic) =>
    topic.evidence_sources.includes("publication"),
  ),
  "primary expertise should cite publications",
);

assert.equal(few.expertise_profile.primary_expertise.length > 0 || few.expertise_profile.secondary_expertise.length > 0, true);
assert.ok(
  few.expertise_profile.primary_expertise.concat(few.expertise_profile.secondary_expertise).every(
    (topic) => topic.topic.toLowerCase().includes("urban poverty"),
  ) || few.analysis_status === "ai_analyzed",
);

assert.equal(none.analysis_status, "insufficient_evidence");
assert.equal(none.expertise_profile.primary_expertise.length, 0);

const broadTopics = [
  ...broad.expertise_profile.primary_expertise,
  ...broad.expertise_profile.secondary_expertise,
].map((item) => item.topic.toLowerCase());
assert.ok(broadTopics.some((topic) => topic.includes("community forestry")));
assert.equal(
  broadTopics.some((topic) => ["water", "music", "finance", "sport", "tourism"].includes(topic)),
  false,
);

assert.ok(interdisciplinary.expertise_profile.primary_expertise.length >= 1);
const interTopics = [
  ...interdisciplinary.expertise_profile.primary_expertise,
  ...interdisciplinary.expertise_profile.secondary_expertise,
].map((item) => item.topic.toLowerCase());
assert.ok(interTopics.some((topic) => topic.includes("air pollution")));
assert.ok(interTopics.some((topic) => topic.includes("gender and work")));

const unrelatedTopics = [
  ...unrelated.expertise_profile.primary_expertise,
  ...unrelated.expertise_profile.secondary_expertise,
].map((item) => item.topic.toLowerCase());
assert.ok(unrelatedTopics.some((topic) => topic.includes("climate adaptation")));
assert.equal(unrelatedTopics.some((topic) => topic.includes("poetry") || topic.includes("museum")), false);

assert.equal(incomplete.analysis_status, "insufficient_evidence");
assert.equal(incomplete.expertise_profile.research_domains.length, 0);

assert.equal(duplicates.evidence_summary.duplicate_publications_collapsed, 1);
assert.equal(duplicates.evidence_summary.total_publications_analyzed, 2);
assert.ok(
  duplicates.expertise_profile.primary_expertise.concat(duplicates.expertise_profile.secondary_expertise).some(
    (topic) => topic.topic.toLowerCase().includes("community forestry"),
  ),
);

assert.ok(many.expertise_profile.research_methods.includes("Qualitative Research") || many.expertise_profile.research_methods.includes("Survey Research") || many.expertise_profile.research_methods.includes("Ethnography"));
assert.ok(many.expertise_profile.geographical_focus.includes("Thailand"));
assert.ok(many.expertise_profile.target_populations.includes("Migrant Communities"));
assert.ok(many.expertise_profile.research_domains.includes("Sociology and Anthropology"));

const fabricated = applyAiNormalization(
  many,
  {
    topics: [
      {
        topic: "Quantum biology",
        kind: "primary",
        evidence_ids: ["missing-id"],
        rationale: "Invented from nowhere",
      },
    ],
  },
  "evidence-weighted-v1+test",
);
assert.ok(
  fabricated.expertise_profile.primary_expertise.some((topic) =>
    topic.topic.toLowerCase().includes("forced migration"),
  ),
  "invalid AI topics must not replace evidence-backed expertise",
);
assert.equal(
  fabricated.expertise_profile.primary_expertise.some((topic) => topic.topic === "Quantum biology"),
  false,
);

const grounded = applyAiNormalization(
  many,
  {
    topics: many.expertise_profile.primary_expertise.map((topic) => ({
      topic: topic.topic,
      kind: "primary",
      evidence_ids: topic.evidence.map((item) => item.id),
      rationale: `Supported by "${topic.evidence[0]?.label ?? ""}"`,
    })),
  },
  "evidence-weighted-v1+test",
);
assert.equal(grounded.model_version, "evidence-weighted-v1+test");
assert.ok(grounded.expertise_profile.primary_expertise.length >= 1);

console.log("expertise engine tests passed");
