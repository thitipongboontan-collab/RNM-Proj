import { unstable_cache } from "next/cache";
import { COLLABORATION_LOCATION_SEED } from "@/data/collaboration-locations";
import { createSupabaseClient } from "@/lib/supabase/client";

type ResearcherRow = {
  researcher_id: string;
  name_th: string;
  name_en: string | null;
  department: string;
};

type CollaborationRow = {
  researcher_id: string;
  organization_name: string;
  org_order: number | null;
};

type LocationRow = {
  organization_name: string;
  country: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  location_level: "province" | "country" | "unknown";
};

export type SpatialResearcher = {
  id: string;
  name: string;
  nameEn?: string;
  department: string;
};

export type SpatialOrganization = {
  name: string;
  country: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  locationLevel: "province" | "country" | "unknown";
  collaborationCount: number;
  researchers: SpatialResearcher[];
};

export type SpatialAggregate = {
  key: string;
  label: string;
  count: number;
  latitude: number;
  longitude: number;
  organizations: string[];
  researchers: string[];
};

export type SpatialDashboardData = {
  organizations: SpatialOrganization[];
  domesticCount: number;
  internationalCount: number;
  mappedCount: number;
  unmappedCount: number;
  countries: string[];
  researchers: SpatialResearcher[];
  provinceAggregates: SpatialAggregate[];
  regionAggregates: SpatialAggregate[];
  countryAggregates: SpatialAggregate[];
};

function mapLocationSeed(): LocationRow[] {
  return COLLABORATION_LOCATION_SEED.map((item) => ({
    organization_name: item.organizationName,
    country: item.country,
    province: item.province,
    region: item.region,
    latitude: item.latitude,
    longitude: item.longitude,
    location_level: item.locationLevel,
  }));
}

function normalizeResearcher(row: ResearcherRow): SpatialResearcher {
  return {
    id: row.researcher_id,
    name: row.name_th,
    nameEn: row.name_en ?? undefined,
    department: row.department,
  };
}

function buildAggregate(
  keyPrefix: "province" | "region" | "country",
  label: string,
  organizations: SpatialOrganization[],
): SpatialAggregate {
  const totalCollaborations = organizations.reduce(
    (sum, item) => sum + item.collaborationCount,
    0,
  );
  const totalWeight = Math.max(totalCollaborations, organizations.length, 1);

  const weightedLatitude =
    organizations.reduce(
      (sum, item) => sum + item.latitude * Math.max(item.collaborationCount, 1),
      0,
    ) / totalWeight;
  const weightedLongitude =
    organizations.reduce(
      (sum, item) => sum + item.longitude * Math.max(item.collaborationCount, 1),
      0,
    ) / totalWeight;

  const researcherNames = new Set<string>();
  for (const organization of organizations) {
    for (const researcher of organization.researchers) {
      researcherNames.add(researcher.name);
    }
  }

  return {
    key: `${keyPrefix}:${label}`,
    label,
    count: totalCollaborations,
    latitude: weightedLatitude,
    longitude: weightedLongitude,
    organizations: organizations.map((item) => item.name).sort((a, b) => a.localeCompare(b)),
    researchers: [...researcherNames].sort((a, b) => a.localeCompare(b, "th")),
  };
}

function groupAggregates(
  organizations: SpatialOrganization[],
  keyPrefix: "province" | "region" | "country",
  getLabel: (item: SpatialOrganization) => string,
): SpatialAggregate[] {
  const grouped = new Map<string, SpatialOrganization[]>();
  for (const organization of organizations) {
    const label = getLabel(organization);
    grouped.set(label, [...(grouped.get(label) ?? []), organization]);
  }

  return [...grouped.entries()]
    .map(([label, items]) => buildAggregate(keyPrefix, label, items))
    .sort((a, b) => b.count - a.count);
}

async function loadLocationRows(): Promise<LocationRow[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return mapLocationSeed();

  const { data, error } = await supabase
    .from("collaboration_organization_locations")
    .select("organization_name, country, province, region, latitude, longitude, location_level");

  if (error || !data?.length) {
    if (error) {
      console.warn(
        "Spatial location table unavailable, using local seed:",
        error.message,
      );
    }
    return mapLocationSeed();
  }

  return data as LocationRow[];
}

async function fetchSpatialDashboardDataFromDb(): Promise<SpatialDashboardData> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      organizations: [],
      domesticCount: 0,
      internationalCount: 0,
      mappedCount: 0,
      unmappedCount: 0,
      countries: [],
      researchers: [],
      provinceAggregates: [],
      regionAggregates: [],
      countryAggregates: [],
    };
  }

  const [researchersResult, collaborationsResult, locations] = await Promise.all([
    supabase
      .from("researchers")
      .select("researcher_id, name_th, name_en, department")
      .order("researcher_id"),
    supabase
      .from("researcher_collaborations")
      .select("researcher_id, organization_name, org_order")
      .order("organization_name"),
    loadLocationRows(),
  ]);

  if (researchersResult.error) {
    console.error("Failed to fetch researchers for spatial dashboard:", researchersResult.error.message);
  }

  if (collaborationsResult.error) {
    console.error(
      "Failed to fetch collaborations for spatial dashboard:",
      collaborationsResult.error.message,
    );
  }

  const researchersById = new Map(
    ((researchersResult.data ?? []) as ResearcherRow[]).map((row) => [
      row.researcher_id,
      normalizeResearcher(row),
    ]),
  );
  const locationsByOrg = new Map(locations.map((row) => [row.organization_name, row]));
  const organizationsByName = new Map<string, SpatialOrganization>();

  for (const row of (collaborationsResult.data ?? []) as CollaborationRow[]) {
    const researcher = researchersById.get(row.researcher_id);
    if (!researcher) continue;

    const location = locationsByOrg.get(row.organization_name);
    if (!location) continue;

    const existing = organizationsByName.get(row.organization_name);
    if (existing) {
      existing.collaborationCount += 1;
      if (!existing.researchers.some((item) => item.id === researcher.id)) {
        existing.researchers.push(researcher);
      }
      continue;
    }

    organizationsByName.set(row.organization_name, {
      name: row.organization_name,
      country: location.country,
      province: location.province,
      region: location.region,
      latitude: location.latitude,
      longitude: location.longitude,
      locationLevel: location.location_level,
      collaborationCount: 1,
      researchers: [researcher],
    });
  }

  const organizations = [...organizationsByName.values()].sort(
    (a, b) => b.collaborationCount - a.collaborationCount || a.name.localeCompare(b.name),
  );
  const mappedOrganizations = organizations.filter((item) => item.locationLevel !== "unknown");
  const domesticCount = mappedOrganizations
    .filter((item) => item.country === "Thailand")
    .reduce((sum, item) => sum + item.collaborationCount, 0);
  const internationalCount = mappedOrganizations
    .filter((item) => item.country !== "Thailand")
    .reduce((sum, item) => sum + item.collaborationCount, 0);

  return {
    organizations,
    domesticCount,
    internationalCount,
    mappedCount: mappedOrganizations.length,
    unmappedCount: organizations.length - mappedOrganizations.length,
    countries: [...new Set(mappedOrganizations.map((item) => item.country))].sort((a, b) =>
      a.localeCompare(b),
    ),
    researchers: [...researchersById.values()].sort((a, b) => a.name.localeCompare(b.name, "th")),
    provinceAggregates: groupAggregates(
      mappedOrganizations,
      "province",
      (item) => item.country === "Thailand" ? item.province : item.country,
    ),
    regionAggregates: groupAggregates(mappedOrganizations, "region", (item) => item.region),
    countryAggregates: groupAggregates(mappedOrganizations, "country", (item) => item.country),
  };
}

const getSpatialDashboardDataCached = unstable_cache(
  fetchSpatialDashboardDataFromDb,
  ["spatial-dashboard"],
  { revalidate: 300 },
);

export async function getSpatialDashboardData(): Promise<SpatialDashboardData> {
  return getSpatialDashboardDataCached();
}
