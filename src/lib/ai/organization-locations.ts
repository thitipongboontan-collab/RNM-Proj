import { COLLABORATION_LOCATION_SEED } from "@/data/collaboration-locations";
import { normalizeText } from "@/lib/ai/researcher-meta";

let organizationCountryMap: Map<string, string> | null = null;

export function getOrganizationCountryMap(): Map<string, string> {
  if (organizationCountryMap) return organizationCountryMap;

  organizationCountryMap = new Map();
  for (const item of COLLABORATION_LOCATION_SEED) {
    if (item.locationLevel === "unknown" || item.country === "Unknown") continue;
    organizationCountryMap.set(normalizeText(item.organizationName), item.country);
  }

  return organizationCountryMap;
}

export function resolveOrganizationCountry(
  organizationName: string,
  countryMap = getOrganizationCountryMap(),
): string | null {
  const normalized = normalizeText(organizationName);
  if (!normalized || normalized === "-") return null;
  return countryMap.get(normalized) ?? null;
}
