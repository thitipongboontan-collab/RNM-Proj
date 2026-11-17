/**
 * Analyze expertise profiles for every researcher.
 * Prerequisites:
 * 1. Run supabase/researcher-expertise-profiles-schema.sql
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 3. Optional OPENAI_API_KEY for label normalization
 *
 * Usage: npm run expertise:analyze
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalizeExpertiseWithModel } from "@/lib/expertise/ai-extract";
import { buildExpertiseProfile, sourceFingerprint } from "@/lib/expertise/engine";
import type { ExpertiseProfile, ExpertiseSourceRecord } from "@/lib/expertise/types";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function isProfile(value: unknown): value is ExpertiseProfile {
  return Boolean(value && typeof value === "object" && "expertise_profile" in value);
}

function sortText<T extends { order: number | null; text: string }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((row) => row.text);
}

async function loadSource(
  supabase: ReturnType<typeof createClient>,
  researcherId: string,
  department: string,
): Promise<ExpertiseSourceRecord> {
  const [degrees, expertise, keywords, publications, projects] = await Promise.all([
    supabase.from("researcher_degrees").select("degree_text, degree_order").eq("researcher_id", researcherId),
    supabase.from("researcher_expertise").select("expertise, expertise_order").eq("researcher_id", researcherId),
    supabase.from("researcher_keywords").select("keyword, keyword_order").eq("researcher_id", researcherId),
    supabase.from("publications").select("publication_id, title, year").eq("researcher_id", researcherId),
    supabase.from("researcher_projects").select("id, project_name, role_label").eq("researcher_id", researcherId),
  ]);

  for (const result of [degrees, expertise, keywords, publications]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    researcherId,
    department,
    degrees: sortText(
      (degrees.data ?? []).map((row) => ({
        order: (row.degree_order as number | null) ?? 0,
        text: String(row.degree_text ?? ""),
      })),
    ),
    manualExpertise: sortText(
      (expertise.data ?? []).map((row) => ({
        order: (row.expertise_order as number | null) ?? 0,
        text: String(row.expertise ?? ""),
      })),
    ),
    keywords: sortText(
      (keywords.data ?? []).map((row) => ({
        order: (row.keyword_order as number | null) ?? 0,
        text: String(row.keyword ?? ""),
      })),
    ),
    publications: (publications.data ?? []).map((row) => ({
      id: String(row.publication_id),
      title: String(row.title ?? ""),
      year: typeof row.year === "number" ? row.year : null,
    })),
    projects: projects.error
      ? []
      : (projects.data ?? []).map((row) => ({
          id: String(row.id),
          title: String(row.project_name ?? ""),
          role: String(row.role_label ?? ""),
        })),
  };
}

async function main() {
  const env = loadEnv();
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || "gpt-4o-mini";
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: researchers, error } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, department")
    .order("researcher_id");
  if (error) throw new Error(error.message);
  if (!researchers?.length) throw new Error("No researchers found");

  const { data: existingRows, error: existingError } = await supabase
    .from("researcher_expertise_profiles")
    .select("researcher_id, analysis_status, display_origin, display_profile, source_fingerprint, ai_profile");
  if (existingError) throw new Error(existingError.message);

  const existingById = new Map(
    (existingRows ?? []).map((row) => [String(row.researcher_id), row]),
  );

  console.log(`Analyzing ${researchers.length} researchers${apiKey ? ` with ${model}` : " without OpenAI"}`);

  const counts = {
    analyzed: 0,
    insufficient: 0,
    skipped: 0,
    failed: 0,
    openai: 0,
  };

  for (const [index, researcher] of researchers.entries()) {
    const researcherId = String(researcher.researcher_id);
    const label = `${index + 1}/${researchers.length} ${researcherId} ${researcher.name_th}`;
    try {
      const source = await loadSource(supabase, researcherId, String(researcher.department ?? ""));
      const fingerprint = sourceFingerprint(source);
      const existing = existingById.get(researcherId);
      if (
        existing?.source_fingerprint === fingerprint &&
        isProfile(existing.ai_profile)
      ) {
        counts.skipped += 1;
        console.log(`skip  ${label}`);
        continue;
      }

      let profile = buildExpertiseProfile(source);
      if (apiKey && profile.analysis_status !== "insufficient_evidence") {
        profile = await normalizeExpertiseWithModel(profile, apiKey, model);
        counts.openai += 1;
      }

      const locked =
        existing?.display_origin === "admin" || existing?.analysis_status === "approved";
      const status = locked ? "needs_review" : profile.analysis_status;
      const displayProfile = locked && isProfile(existing?.display_profile)
        ? existing.display_profile
        : profile;

      const { error: upsertError } = await supabase.from("researcher_expertise_profiles").upsert(
        {
          researcher_id: researcherId,
          analysis_status: status,
          ai_profile: profile,
          display_profile: displayProfile,
          display_origin: locked ? "admin" : "ai",
          source_fingerprint: fingerprint,
          model_version: profile.model_version,
          confidence_method: profile.confidence_method,
          analyzed_at: profile.last_analyzed_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "researcher_id" },
      );
      if (upsertError) throw new Error(upsertError.message);

      if (profile.analysis_status === "insufficient_evidence") counts.insufficient += 1;
      else counts.analyzed += 1;

      const primary = profile.expertise_profile.primary_expertise[0]?.topic ?? "—";
      console.log(`${status.padEnd(22)} ${label} | ${primary}`);
    } catch (error) {
      counts.failed += 1;
      console.error(`fail  ${label}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(
    `\nDone. analyzed=${counts.analyzed} insufficient=${counts.insufficient} skipped=${counts.skipped} openai=${counts.openai} failed=${counts.failed}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
