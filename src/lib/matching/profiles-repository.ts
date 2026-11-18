import { createSupabaseClient } from "@/lib/supabase/client";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";
import { selectProfileForMatching } from "@/lib/matching/profile";
import type { MatchingProfileRecord } from "@/lib/matching/types";

export async function loadMatchingProfiles(): Promise<Map<string, MatchingProfileRecord>> {
  const map = new Map<string, MatchingProfileRecord>();
  const supabase = createSupabaseClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("researcher_expertise_profiles")
    .select("researcher_id, analysis_status, display_origin, display_profile, ai_profile");

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to load matching profiles:", error.message);
    }
    return map;
  }

  for (const row of data ?? []) {
    const record = selectProfileForMatching({
      researcherId: String(row.researcher_id),
      analysisStatus: row.analysis_status,
      displayOrigin: row.display_origin,
      displayProfile: row.display_profile,
      aiProfile: row.ai_profile,
    });
    map.set(record.researcherId, record);
  }

  return map;
}
