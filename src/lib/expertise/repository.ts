import { revalidateResearcherCaches } from "@/lib/admin/revalidate";
import { normalizeExpertiseWithModel } from "@/lib/expertise/ai-extract";
import { buildExpertiseProfile, sourceFingerprint } from "@/lib/expertise/engine";
import type { ExpertiseProfile, ExpertiseSourceRecord } from "@/lib/expertise/types";
import { EXPERTISE_STATUSES, type ExpertiseAnalysisStatus } from "@/lib/expertise/types";
import { profileFromAdminEdit } from "@/lib/expertise/validate";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";

type ProfileRow = {
  researcher_id: string;
  analysis_status: ExpertiseAnalysisStatus;
  ai_profile: ExpertiseProfile | null;
  display_profile: ExpertiseProfile | null;
  display_origin: "ai" | "admin" | null;
  source_fingerprint: string | null;
  model_version: string | null;
  confidence_method: string | null;
  analyzed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
};

export type ExpertiseAdminListItem = {
  researcherId: string;
  nameTh: string;
  department: string;
  status: ExpertiseAnalysisStatus | "pending";
  analyzedAt: string | null;
  displayOrigin: "ai" | "admin" | null;
};

function adminClient() {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function isProfile(value: unknown): value is ExpertiseProfile {
  if (!value || typeof value !== "object") return false;
  const record = value as ExpertiseProfile;
  return Boolean(record.expertise_profile && record.researcher_id);
}

export async function loadExpertiseSource(researcherId: string): Promise<ExpertiseSourceRecord | null> {
  const supabase = adminClient();
  const { data: researcher, error } = await supabase
    .from("researchers")
    .select("researcher_id, department")
    .eq("researcher_id", researcherId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!researcher) return null;

  const [degrees, expertise, keywords, publications, projects] = await Promise.all([
    supabase.from("researcher_degrees").select("degree_text, degree_order").eq("researcher_id", researcherId),
    supabase.from("researcher_expertise").select("expertise, expertise_order").eq("researcher_id", researcherId),
    supabase.from("researcher_keywords").select("keyword, keyword_order").eq("researcher_id", researcherId),
    supabase.from("publications").select("publication_id, title, year").eq("researcher_id", researcherId),
    supabase
      .from("researcher_projects")
      .select("id, project_name, role_label")
      .eq("researcher_id", researcherId),
  ]);

  for (const result of [degrees, expertise, keywords, publications]) {
    if (result.error) throw new Error(result.error.message);
  }
  if (projects.error && !isMissingSchemaError(projects.error.message)) {
    throw new Error(projects.error.message);
  }

  const sortText = <T extends { order: number | null; text: string }>(rows: T[]) =>
    [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((row) => row.text);

  return {
    researcherId,
    department: String(researcher.department ?? ""),
    degrees: sortText(
      (degrees.data ?? []).map((row) => ({
        order: row.degree_order as number | null,
        text: String(row.degree_text ?? ""),
      })),
    ),
    manualExpertise: sortText(
      (expertise.data ?? []).map((row) => ({
        order: row.expertise_order as number | null,
        text: String(row.expertise ?? ""),
      })),
    ),
    keywords: sortText(
      (keywords.data ?? []).map((row) => ({
        order: row.keyword_order as number | null,
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

async function readProfileRow(researcherId: string): Promise<ProfileRow | null> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("researcher_expertise_profiles")
    .select(
      "researcher_id, analysis_status, ai_profile, display_profile, display_origin, source_fingerprint, model_version, confidence_method, analyzed_at, reviewed_at, reviewed_by, review_note",
    )
    .eq("researcher_id", researcherId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error.message)) return null;
    throw new Error(error.message);
  }
  return (data as ProfileRow | null) ?? null;
}

export async function getExpertiseProfile(researcherId: string): Promise<ExpertiseProfile | null> {
  const row = await readProfileRow(researcherId);
  if (!row?.display_profile || row.analysis_status === "rejected") return null;
  return isProfile(row.display_profile) ? row.display_profile : null;
}

export async function getExpertiseAdminDetail(researcherId: string) {
  const [source, row] = await Promise.all([
    loadExpertiseSource(researcherId),
    readProfileRow(researcherId),
  ]);
  return { source, row };
}

export async function listExpertiseAdmin(): Promise<ExpertiseAdminListItem[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, department")
    .order("name_th");

  if (error) throw new Error(error.message);

  const profiles = await supabase
    .from("researcher_expertise_profiles")
    .select("researcher_id, analysis_status, analyzed_at, display_origin");

  if (profiles.error) {
    throw new Error(profiles.error.message);
  }

  const byId = new Map(
    ((profiles.data ?? []) as Array<{
      researcher_id: string;
      analysis_status: ExpertiseAnalysisStatus;
      analyzed_at: string | null;
      display_origin: "ai" | "admin" | null;
    }>).map((row) => [row.researcher_id, row]),
  );

  return (data ?? []).map((row) => {
    const profile = byId.get(String(row.researcher_id));
    return {
      researcherId: String(row.researcher_id),
      nameTh: String(row.name_th),
      department: String(row.department),
      status: profile?.analysis_status ?? "pending",
      analyzedAt: profile?.analyzed_at ?? null,
      displayOrigin: profile?.display_origin ?? null,
    };
  });
}

export async function analyzeResearcherExpertise(
  researcherId: string,
  options: { force?: boolean } = {},
): Promise<ExpertiseProfile> {
  const source = await loadExpertiseSource(researcherId);
  if (!source) throw new Error("ไม่พบนักวิจัย");

  const fingerprint = sourceFingerprint(source);
  const existing = await readProfileRow(researcherId);
  if (
    !options.force &&
    existing?.source_fingerprint === fingerprint &&
    existing.ai_profile &&
    isProfile(existing.ai_profile)
  ) {
    return existing.ai_profile;
  }

  let profile = buildExpertiseProfile(source);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (apiKey && profile.analysis_status !== "insufficient_evidence") {
    try {
      profile = await normalizeExpertiseWithModel(profile, apiKey, model);
    } catch (error) {
      console.error("Expertise model normalization skipped:", error);
    }
  }

  const locked = existing?.display_origin === "admin" || existing?.analysis_status === "approved";
  const status: ExpertiseAnalysisStatus = locked
    ? "needs_review"
    : profile.analysis_status;
  const displayProfile = locked ? existing?.display_profile ?? profile : profile;

  const supabase = adminClient();
  const { error } = await supabase.from("researcher_expertise_profiles").upsert(
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

  if (error) throw new Error(error.message);
  try {
    revalidateResearcherCaches(researcherId);
  } catch (error) {
    console.error("Skipped cache revalidation:", error);
  }
  return profile;
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveExpertiseReview(input: {
  researcherId: string;
  status: string;
  note: string;
  reviewer: string;
  primaryText: string;
  secondaryText: string;
  methodsText: string;
  geographyText: string;
  populationsText: string;
  domainsText: string;
}) {
  if (!EXPERTISE_STATUSES.includes(input.status as ExpertiseAnalysisStatus)) {
    throw new Error("สถานะไม่ถูกต้อง");
  }
  const status = input.status as ExpertiseAnalysisStatus;
  const existing = await readProfileRow(input.researcherId);
  const base =
    (existing?.display_profile && isProfile(existing.display_profile) && existing.display_profile) ||
    (existing?.ai_profile && isProfile(existing.ai_profile) && existing.ai_profile) ||
    buildExpertiseProfile({
      researcherId: input.researcherId,
      department: "",
      degrees: [],
      manualExpertise: [],
      keywords: [],
      publications: [],
      projects: [],
    });

  const edited = profileFromAdminEdit(base, {
    primary: lines(input.primaryText),
    secondary: lines(input.secondaryText),
    methods: lines(input.methodsText),
    geography: lines(input.geographyText),
    populations: lines(input.populationsText),
    domains: lines(input.domainsText),
  });
  edited.analysis_status = status;

  const supabase = adminClient();
  const { error } = await supabase.from("researcher_expertise_profiles").upsert(
    {
      researcher_id: input.researcherId,
      analysis_status: status,
      ai_profile: existing?.ai_profile ?? null,
      display_profile: status === "rejected" ? edited : edited,
      display_origin: "admin",
      source_fingerprint: existing?.source_fingerprint ?? null,
      model_version: existing?.model_version ?? edited.model_version,
      confidence_method: edited.confidence_method,
      analyzed_at: existing?.analyzed_at ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewer,
      review_note: input.note.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "researcher_id" },
  );

  if (error) throw new Error(error.message);
  revalidateResearcherCaches(input.researcherId);
}
