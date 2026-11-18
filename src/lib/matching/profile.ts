import type { ExpertiseProfile } from "@/lib/expertise/types";
import type { MatchingProfileRecord } from "@/lib/matching/types";

function isProfile(value: unknown): value is ExpertiseProfile {
  return Boolean(value && typeof value === "object" && "expertise_profile" in value);
}

export function selectProfileForMatching(input: {
  researcherId: string;
  analysisStatus?: string | null;
  displayOrigin?: string | null;
  displayProfile?: unknown;
  aiProfile?: unknown;
}): MatchingProfileRecord {
  const analysisStatus = (input.analysisStatus ?? "missing") as MatchingProfileRecord["analysisStatus"];
  const displayOrigin =
    input.displayOrigin === "admin" || input.displayOrigin === "ai" ? input.displayOrigin : null;

  if (analysisStatus === "rejected") {
    return {
      researcherId: input.researcherId,
      analysisStatus,
      displayOrigin,
      verified: false,
      profile: null,
    };
  }

  // Matching never reads ai_profile, including when an approved/admin display_profile is empty.
  void input.aiProfile;
  const displayProfile = isProfile(input.displayProfile) ? input.displayProfile : null;
  const verified = displayOrigin === "admin" || analysisStatus === "approved";

  return {
    researcherId: input.researcherId,
    analysisStatus: analysisStatus === "missing" && !displayProfile ? "missing" : analysisStatus,
    displayOrigin,
    verified,
    profile: displayProfile,
  };
}
