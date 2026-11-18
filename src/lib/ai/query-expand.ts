import { expandQueryTokens, mergeSearchTerms } from "@/lib/ai/text-utils";

const relatedTermCache = new Map<string, string[]>();
const CACHE_LIMIT = 80;

function cacheTerms(key: string, terms: string[]) {
  if (relatedTermCache.has(key)) relatedTermCache.delete(key);
  relatedTermCache.set(key, terms);
  if (relatedTermCache.size > CACHE_LIMIT) {
    const oldest = relatedTermCache.keys().next().value;
    if (oldest) relatedTermCache.delete(oldest);
  }
}

function parseTermPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const terms = (payload as { terms?: unknown }).terms;
  if (!Array.isArray(terms)) return [];
  return terms.filter((item): item is string => typeof item === "string" && item.trim().length >= 2);
}

export async function expandRelatedTermsWithModel(
  message: string,
  apiKey?: string,
): Promise<string[]> {
  const cacheKey = message.trim().toLowerCase();
  const cached = relatedTermCache.get(cacheKey);
  if (cached) return cached;

  if (!apiKey) {
    const local = expandQueryTokens(message);
    cacheTerms(cacheKey, local);
    return local;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Expand a research-search query into related Thai and English search terms.",
              "Include place-name romanizations, English equivalents, and closely related academic terms.",
              "Do not invent researcher names. Return JSON {\"terms\":[\"...\"] } with at most 16 short terms.",
            ].join(" "),
          },
          { role: "user", content: message },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const local = expandQueryTokens(message);
      cacheTerms(cacheKey, local);
      return local;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseTermPayload(JSON.parse(content) as unknown);
    const terms = mergeSearchTerms(expandQueryTokens(message), parsed);
    cacheTerms(cacheKey, terms);
    return terms;
  } catch {
    const local = expandQueryTokens(message);
    cacheTerms(cacheKey, local);
    return local;
  }
}
