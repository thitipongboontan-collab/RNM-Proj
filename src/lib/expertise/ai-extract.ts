import { applyAiNormalization, parseAiPayload } from "@/lib/expertise/validate";
import type { ExpertiseProfile } from "@/lib/expertise/types";

function packet(profile: ExpertiseProfile) {
  const topics = [
    ...profile.expertise_profile.primary_expertise,
    ...profile.expertise_profile.secondary_expertise,
  ].map((topic) => ({
    topic: topic.topic,
    proposed_level: profile.expertise_profile.primary_expertise.includes(topic)
      ? "primary"
      : "secondary",
    evidence: topic.evidence.map((item) => ({
      id: item.id,
      source: item.source,
      label: item.label,
    })),
  }));

  return {
    researcher_id: profile.researcher_id,
    topics,
    research_methods: profile.expertise_profile.research_methods,
    geographical_focus: profile.expertise_profile.geographical_focus,
    target_populations: profile.expertise_profile.target_populations,
    research_domains: profile.expertise_profile.research_domains,
  };
}

export async function normalizeExpertiseWithModel(
  profile: ExpertiseProfile,
  apiKey: string,
  model: string,
): Promise<ExpertiseProfile> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You normalize researcher expertise labels.",
            "Use only evidence ids present in the payload.",
            "Do not invent publications, projects, methods, places, or populations.",
            "Do not add a topic that has no evidence ids.",
            "Merge only labels that are the same concept.",
            "Keep primary and secondary levels unless the cited evidence clearly belongs together.",
            "Return JSON with topics[{topic, kind, evidence_ids, rationale}], research_methods[{label, evidence_ids}], geographical_focus[{label, evidence_ids}], target_populations[{label, evidence_ids}], research_domains[{label, evidence_ids}].",
            "kind is primary or secondary.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(packet(profile)),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI expertise normalization failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? "";
  const parsed = parseAiPayload(content);
  return applyAiNormalization(profile, parsed, `${profile.model_version}+${model}`);
}
