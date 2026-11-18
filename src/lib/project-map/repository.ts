import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";
import {
  buildCascadingFilterOptions,
  filterDashboardData,
} from "@/lib/project-map/filters";
import type {
  ProjectMapDashboardData,
  ProjectMapDetail,
  ProjectMapFeature,
  ProjectMapFilters,
  ProjectMapListItem,
  ProjectMapLocationSummary,
  ProjectMapOperatingArea,
  VerificationStatus,
} from "@/lib/project-map/types";
import type { GeoJsonValue } from "@/lib/project-map/types";
import {
  buildResearcherLookup,
  matchProjectResearchers,
  type SystemResearcher,
} from "@/lib/project-map/researcher-match";
import {
  canMapGeometry,
  classifyAreaScope,
  isValidGeoJsonGeometry,
  resolveGeometryType,
  splitAreaTokens,
} from "@/lib/project-map/validation";

type LocationRow = {
  location_id: string;
  area_name: string | null;
  tambon: string | null;
  amphoe: string | null;
  province: string | null;
  country: string | null;
  region: string | null;
};

type GeometryRow = {
  location_id: string;
  geometry_type: string | null;
  latitude: number | null;
  longitude: number | null;
  geojson: unknown;
  verification_status: VerificationStatus;
};

type ProjectRow = {
  project_id: string;
  title_th: string;
  title_en: string | null;
  fiscal_year_be: number | null;
  sdg: string | null;
  strategy: string | null;
  research_group: string | null;
  research_type: string | null;
  start_year_be: number | null;
  end_year_be: number | null;
  funding_kind: string | null;
  funding_source: string | null;
  principal_investigator: string | null;
  co_investigators: string | null;
};

type ProjectLocationRow = {
  project_location_id: string;
  project_id: string;
  location_id: string;
  area_name: string | null;
  tambon: string | null;
  amphoe: string | null;
  province: string | null;
  country: string | null;
  region: string | null;
};

function emptyDashboard(): ProjectMapDashboardData {
  return {
    projects: [],
    features: [],
    locations: [],
    filterOptions: {
      provinces: [],
      amphoes: [],
      tambons: [],
      fiscalYears: [],
      sdgs: [],
      researchGroups: [],
      researchTypes: [],
      principalInvestigators: [],
      fundingSources: [],
    },
    stats: {
      projectCount: 0,
      mappableFeatureCount: 0,
      pendingLocationCount: 0,
      domesticProjectCount: 0,
      internationalProjectCount: 0,
    },
  };
}

function positionLabel(status: VerificationStatus, hasGeometry: boolean) {
  if (hasGeometry) return "มีตำแหน่งบนแผนที่";
  if (status === "wide_area") return "รอตรวจสอบตำแหน่ง (พื้นที่กว้าง)";
  if (status === "multi_area" || status === "needs_split") {
    return "รอตรวจสอบตำแหน่ง (หลายพื้นที่ ต้องแยกก่อน)";
  }
  if (status === "failed") return "รอตรวจสอบตำแหน่ง (ค้นหาพิกัดไม่สำเร็จ)";
  return "รอตรวจสอบตำแหน่ง";
}

async function loadProjectMapDashboardUncached(): Promise<ProjectMapDashboardData> {
  // Public publishable client (no cookies) — required inside unstable_cache.
  const supabase = createSupabaseClient();
  if (!supabase) return emptyDashboard();

  const [locationsRes, geometriesRes, projectsRes, linksRes, researchersRes] = await Promise.all([
    supabase.from("map_research_locations").select(
      "location_id, area_name, tambon, amphoe, province, country, region",
    ),
    supabase.from("map_location_geometries").select(
      "location_id, geometry_type, latitude, longitude, geojson, verification_status",
    ),
    supabase.from("map_research_projects").select(
      "project_id, title_th, title_en, fiscal_year_be, sdg, strategy, research_group, research_type, start_year_be, end_year_be, funding_kind, funding_source, principal_investigator, co_investigators",
    ),
    supabase.from("map_research_project_locations").select(
      "project_location_id, project_id, location_id, area_name, tambon, amphoe, province, country, region",
    ),
    supabase.from("researchers").select("researcher_id, name_th, name_en"),
  ]);

  const schemaError = [locationsRes, geometriesRes, projectsRes, linksRes].find(
    (result) => result.error && isMissingSchemaError(result.error.message),
  );
  if (schemaError?.error) {
    return emptyDashboard();
  }

  for (const result of [locationsRes, geometriesRes, projectsRes, linksRes, researchersRes]) {
    if (result.error) throw new Error(result.error.message);
  }

  const locations = (locationsRes.data ?? []) as LocationRow[];
  const geometries = (geometriesRes.data ?? []) as GeometryRow[];
  const projects = (projectsRes.data ?? []) as ProjectRow[];
  const links = (linksRes.data ?? []) as ProjectLocationRow[];
  const researcherLookup = buildResearcherLookup(
    ((researchersRes.data ?? []) as Array<{
      researcher_id: string;
      name_th: string;
      name_en: string | null;
    }>).map((row): SystemResearcher => ({
      researcherId: row.researcher_id,
      nameTh: row.name_th,
      nameEn: row.name_en ?? "",
    })),
  );

  const geometryByLocation = new Map(geometries.map((item) => [item.location_id, item]));
  const locationSummaries: ProjectMapLocationSummary[] = locations.map((location) => {
    const geometry = geometryByLocation.get(location.location_id);
    const verificationStatus = geometry?.verification_status ?? "pending";
    const latitude = geometry?.latitude ?? null;
    const longitude = geometry?.longitude ?? null;
    const geojson =
      geometry?.geojson && isValidGeoJsonGeometry(geometry.geojson)
        ? (geometry.geojson as GeoJsonValue)
        : null;
    const geometryType = resolveGeometryType({
      verificationStatus,
      latitude,
      longitude,
      geojson,
    });
    return {
      locationId: location.location_id,
      areaName: location.area_name ?? "",
      tambon: location.tambon ?? "",
      amphoe: location.amphoe ?? "",
      province: location.province ?? "",
      country: location.country ?? "",
      region: location.region ?? "",
      verificationStatus,
      hasMappableGeometry: canMapGeometry({
        verificationStatus,
        latitude,
        longitude,
        geojson,
      }),
      geometryType,
      latitude,
      longitude,
      geojson: geojson as ProjectMapLocationSummary["geojson"],
    };
  });
  const locationById = new Map(locationSummaries.map((item) => [item.locationId, item]));

  const linksByProject = new Map<string, ProjectLocationRow[]>();
  for (const link of links) {
    linksByProject.set(link.project_id, [...(linksByProject.get(link.project_id) ?? []), link]);
  }

  const listItems: ProjectMapListItem[] = projects.flatMap((project) => {
    const linkedResearchers = matchProjectResearchers({
      principalInvestigator: project.principal_investigator,
      coInvestigators: project.co_investigators,
      lookup: researcherLookup,
    });
    if (!linkedResearchers.length) return [];

    const projectLinks = linksByProject.get(project.project_id) ?? [];
    const locationIds = [...new Set(projectLinks.map((item) => item.location_id))];
    const provinces = [
      ...new Set(
        projectLinks.flatMap((item) => splitAreaTokens(item.province ?? "")),
      ),
    ];
    const operatingAreas: ProjectMapOperatingArea[] = [];
    const seenOperatingAreas = new Set<string>();
    for (const link of projectLinks) {
      const location = locationById.get(link.location_id);
      const area: ProjectMapOperatingArea = {
        areaName: (link.area_name ?? location?.areaName ?? "").trim(),
        tambon: (link.tambon ?? location?.tambon ?? "").trim(),
        amphoe: (link.amphoe ?? location?.amphoe ?? "").trim(),
        province: (link.province ?? location?.province ?? "").trim(),
        region: (link.region ?? location?.region ?? "").trim(),
        country: (link.country ?? location?.country ?? "").trim(),
      };
      const key = [
        area.areaName,
        area.tambon,
        area.amphoe,
        area.province,
        area.region,
        area.country,
      ].join("|");
      if (
        !area.areaName &&
        !area.tambon &&
        !area.amphoe &&
        !area.province &&
        !area.region &&
        !area.country
      ) {
        continue;
      }
      if (seenOperatingAreas.has(key)) continue;
      seenOperatingAreas.add(key);
      operatingAreas.push(area);
    }
    let mappableLocationCount = 0;
    let pendingLocationCount = 0;
    let hasDomesticLocation = false;
    let hasInternationalLocation = false;
    for (const link of projectLinks) {
      const location = locationById.get(link.location_id);
      const scope = classifyAreaScope({
        country: link.country ?? location?.country ?? "",
        province: link.province ?? location?.province ?? "",
        amphoe: link.amphoe ?? location?.amphoe ?? "",
        tambon: link.tambon ?? location?.tambon ?? "",
        areaName: link.area_name ?? location?.areaName ?? "",
        region: link.region ?? location?.region ?? "",
        titleTh: project.title_th,
        titleEn: project.title_en,
      });
      if (scope.domestic) hasDomesticLocation = true;
      if (scope.international) hasInternationalLocation = true;
    }
    if (!hasDomesticLocation && !hasInternationalLocation) {
      const titleScope = classifyAreaScope({
        titleTh: project.title_th,
        titleEn: project.title_en,
      });
      hasDomesticLocation = titleScope.domestic;
      hasInternationalLocation = titleScope.international;
    }
    if (!hasDomesticLocation && !hasInternationalLocation) return [];
    for (const locationId of locationIds) {
      const location = locationById.get(locationId);
      if (!location) continue;
      if (location.hasMappableGeometry) mappableLocationCount += 1;
      else pendingLocationCount += 1;
    }
    return {
      projectId: project.project_id,
      titleTh: project.title_th,
      titleEn: project.title_en ?? "",
      fiscalYearBe: project.fiscal_year_be,
      sdg: project.sdg ?? "",
      strategy: project.strategy ?? "",
      researchGroup: project.research_group ?? "",
      researchType: project.research_type ?? "",
      fundingSource: project.funding_source ?? "",
      principalInvestigator: project.principal_investigator ?? "",
      coInvestigators: project.co_investigators ?? "",
      linkedResearchers,
      locationCount: locationIds.length,
      mappableLocationCount,
      pendingLocationCount,
      provinces,
      locationIds,
      operatingAreas,
      hasDomesticLocation,
      hasInternationalLocation,
    };
  });

  const features: ProjectMapFeature[] = [];
  for (const link of links) {
    const project = projects.find((item) => item.project_id === link.project_id);
    const location = locationById.get(link.location_id);
    if (!project || !location || !location.hasMappableGeometry || !location.geometryType) {
      continue;
    }
    features.push({
      featureId: `${link.project_location_id}:${link.location_id}`,
      projectId: project.project_id,
      locationId: link.location_id,
      projectLocationId: link.project_location_id,
      titleTh: project.title_th,
      geometryType: location.geometryType,
      latitude: location.latitude,
      longitude: location.longitude,
      geojson: location.geojson,
      province: link.province ?? location.province,
      amphoe: link.amphoe ?? location.amphoe,
      tambon: link.tambon ?? location.tambon,
    });
  }

  const allowedProjectIds = new Set(listItems.map((item) => item.projectId));
  const mappedFeatures = features.filter((feature) => allowedProjectIds.has(feature.projectId));
  const optionRows = listItems.flatMap((project) =>
    project.locationIds.map((locationId) => {
      const location = locationById.get(locationId);
      return {
        province: location?.province ?? "",
        amphoe: location?.amphoe ?? "",
        tambon: location?.tambon ?? "",
        fiscalYearBe: project.fiscalYearBe,
        sdg: project.sdg,
        researchGroup: project.researchGroup,
        researchType: project.researchType,
        principalInvestigator: project.principalInvestigator,
        researchers: project.linkedResearchers.map((item) => item.name),
        fundingSource: project.fundingSource,
      };
    }),
  );

  return {
    projects: listItems.sort((a, b) => a.titleTh.localeCompare(b.titleTh, "th")),
    features: mappedFeatures,
    locations: locationSummaries,
    filterOptions: buildCascadingFilterOptions(optionRows, {}),
    stats: {
      projectCount: listItems.length,
      mappableFeatureCount: mappedFeatures.length,
      pendingLocationCount: listItems.reduce((sum, item) => sum + item.pendingLocationCount, 0),
      domesticProjectCount: listItems.filter((item) => item.hasDomesticLocation).length,
      internationalProjectCount: listItems.filter((item) => item.hasInternationalLocation).length,
    },
  };
}

export const getProjectMapDashboardData = unstable_cache(
  loadProjectMapDashboardUncached,
  ["project-map-dashboard-v3"],
  { revalidate: 300 },
);

export async function getFilteredProjectMapData(
  filters: ProjectMapFilters,
): Promise<ProjectMapDashboardData> {
  const data = await getProjectMapDashboardData();
  return filterDashboardData(data, filters);
}

export async function getProjectMapDetail(projectId: string): Promise<ProjectMapDetail | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data: project, error } = await supabase
    .from("map_research_projects")
    .select(
      "project_id, title_th, title_en, fiscal_year_be, sdg, strategy, research_group, research_type, start_year_be, end_year_be, funding_kind, funding_source, principal_investigator, co_investigators",
    )
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error.message)) return null;
    throw new Error(error.message);
  }
  if (!project) return null;

  const { data: links, error: linkError } = await supabase
    .from("map_research_project_locations")
    .select(
      "project_location_id, project_id, location_id, area_name, tambon, amphoe, province, country, region",
    )
    .eq("project_id", projectId);

  if (linkError) throw new Error(linkError.message);

  const locationIds = [...new Set((links ?? []).map((item) => item.location_id))];
  const { data: geometries, error: geometryError } = await supabase
    .from("map_location_geometries")
    .select("location_id, geometry_type, latitude, longitude, geojson, verification_status")
    .in("location_id", locationIds.length ? locationIds : ["__none__"]);

  if (geometryError && !isMissingSchemaError(geometryError.message)) {
    throw new Error(geometryError.message);
  }

  const geometryByLocation = new Map(
    ((geometries ?? []) as GeometryRow[]).map((item) => [item.location_id, item]),
  );

  const { data: researcherRows } = await supabase
    .from("researchers")
    .select("researcher_id, name_th, name_en");
  const linkedResearchers = matchProjectResearchers({
    principalInvestigator: project.principal_investigator,
    coInvestigators: project.co_investigators,
    lookup: buildResearcherLookup(
      ((researcherRows ?? []) as Array<{
        researcher_id: string;
        name_th: string;
        name_en: string | null;
      }>).map((row) => ({
        researcherId: row.researcher_id,
        nameTh: row.name_th,
        nameEn: row.name_en ?? "",
      })),
    ),
  });

  return {
    projectId: project.project_id,
    titleTh: project.title_th,
    titleEn: project.title_en ?? "",
    fiscalYearBe: project.fiscal_year_be,
    sdg: project.sdg ?? "",
    strategy: project.strategy ?? "",
    researchGroup: project.research_group ?? "",
    researchType: project.research_type ?? "",
    startYearBe: project.start_year_be,
    endYearBe: project.end_year_be,
    fundingKind: project.funding_kind ?? "",
    fundingSource: project.funding_source ?? "",
    principalInvestigator: project.principal_investigator ?? "",
    coInvestigators: project.co_investigators ?? "",
    linkedResearchers,
    locations: ((links ?? []) as ProjectLocationRow[]).map((link) => {
      const geometry = geometryByLocation.get(link.location_id);
      const verificationStatus = geometry?.verification_status ?? "pending";
      const latitude = geometry?.latitude ?? null;
      const longitude = geometry?.longitude ?? null;
      const geojson =
        geometry?.geojson && isValidGeoJsonGeometry(geometry.geojson)
          ? (geometry.geojson as GeoJsonValue)
          : null;
      const geometryType = resolveGeometryType({
        verificationStatus,
        latitude,
        longitude,
        geojson,
      });
      const hasGeometry = canMapGeometry({
        verificationStatus,
        latitude,
        longitude,
        geojson,
      });
      return {
        projectLocationId: link.project_location_id,
        locationId: link.location_id,
        areaName: link.area_name ?? "",
        tambon: link.tambon ?? "",
        amphoe: link.amphoe ?? "",
        province: link.province ?? "",
        country: link.country ?? "",
        region: link.region ?? "",
        verificationStatus,
        positionLabel: positionLabel(verificationStatus, hasGeometry),
        geometryType,
        latitude,
        longitude,
        geojson: geojson as ProjectMapDetail["locations"][number]["geojson"],
      };
    }),
  };
}
