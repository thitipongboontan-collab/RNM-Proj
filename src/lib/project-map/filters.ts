import type {
  ProjectMapDashboardData,
  ProjectMapFilters,
  ProjectMapFilterOptions,
  ProjectMapListItem,
} from "@/lib/project-map/types";
import { matchesAreaToken, splitAreaTokens } from "@/lib/project-map/validation";

function includesInsensitive(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function projectMatchesFilters(
  project: ProjectMapListItem,
  locationFields: Array<{
    tambon: string;
    amphoe: string;
    province: string;
  }>,
  filters: ProjectMapFilters,
): boolean {
  if (filters.fiscalYear && filters.fiscalYear !== "all") {
    if (String(project.fiscalYearBe ?? "") !== filters.fiscalYear) return false;
  }
  if (filters.sdg && filters.sdg !== "all" && project.sdg !== filters.sdg) return false;
  if (
    filters.researchGroup &&
    filters.researchGroup !== "all" &&
    project.researchGroup !== filters.researchGroup
  ) {
    return false;
  }
  if (
    filters.researchType &&
    filters.researchType !== "all" &&
    project.researchType !== filters.researchType
  ) {
    return false;
  }
  if (filters.principalInvestigator && filters.principalInvestigator !== "all") {
    const selected = filters.principalInvestigator;
    const linkedHit = project.linkedResearchers.some(
      (researcher) => researcher.name === selected || researcher.researcherId === selected,
    );
    if (!linkedHit) return false;
  }
  if (
    filters.fundingSource &&
    filters.fundingSource !== "all" &&
    project.fundingSource !== filters.fundingSource
  ) {
    return false;
  }

  const needsArea =
    (filters.province && filters.province !== "all") ||
    (filters.amphoe && filters.amphoe !== "all") ||
    (filters.tambon && filters.tambon !== "all");

  if (needsArea) {
    const areaHit = locationFields.some(
      (location) =>
        matchesAreaToken(location.province, filters.province) &&
        matchesAreaToken(location.amphoe, filters.amphoe) &&
        matchesAreaToken(location.tambon, filters.tambon),
    );
    if (!areaHit) return false;
  }

  const query = filters.query?.trim();
  if (query) {
    const blob = [
      project.titleTh,
      project.titleEn,
      project.principalInvestigator,
      project.fundingSource,
      project.researchGroup,
      project.sdg,
      ...project.provinces,
    ].join(" ");
    if (!includesInsensitive(blob, query)) return false;
  }

  return true;
}

export function buildCascadingFilterOptions(
  rows: Array<{
    province: string;
    amphoe: string;
    tambon: string;
    fiscalYearBe: number | null;
    sdg: string;
    researchGroup: string;
    researchType: string;
    principalInvestigator: string;
    researchers?: string[];
    fundingSource: string;
  }>,
  selected: Pick<ProjectMapFilters, "province" | "amphoe">,
): ProjectMapFilterOptions {
  const provinceSet = new Set<string>();
  const amphoeSet = new Set<string>();
  const tambonSet = new Set<string>();
  const fiscalYears = new Set<string>();
  const sdgs = new Set<string>();
  const researchGroups = new Set<string>();
  const researchTypes = new Set<string>();
  const principalInvestigators = new Set<string>();
  const fundingSources = new Set<string>();

  for (const row of rows) {
    for (const province of splitAreaTokens(row.province)) provinceSet.add(province);
    if (row.fiscalYearBe != null) fiscalYears.add(String(row.fiscalYearBe));
    if (row.sdg) sdgs.add(row.sdg);
    if (row.researchGroup) researchGroups.add(row.researchGroup);
    if (row.researchType) researchTypes.add(row.researchType);
    const systemResearchers = row.researchers?.length
      ? row.researchers
      : [];
    for (const name of systemResearchers) {
      if (name) principalInvestigators.add(name);
    }
    if (row.fundingSource) fundingSources.add(row.fundingSource);

    const provinceOk =
      !selected.province ||
      selected.province === "all" ||
      splitAreaTokens(row.province).includes(selected.province);
    if (!provinceOk) continue;

    for (const amphoe of splitAreaTokens(row.amphoe)) amphoeSet.add(amphoe);

    const amphoeOk =
      !selected.amphoe ||
      selected.amphoe === "all" ||
      splitAreaTokens(row.amphoe).includes(selected.amphoe);
    if (!amphoeOk) continue;

    for (const tambon of splitAreaTokens(row.tambon)) tambonSet.add(tambon);
  }

  const sortThai = (values: string[]) =>
    [...values].sort((a, b) => a.localeCompare(b, "th"));

  return {
    provinces: sortThai([...provinceSet]),
    amphoes: sortThai([...amphoeSet]),
    tambons: sortThai([...tambonSet]),
    fiscalYears: [...fiscalYears].sort((a, b) => Number(b) - Number(a)),
    sdgs: sortThai([...sdgs]),
    researchGroups: sortThai([...researchGroups]),
    researchTypes: sortThai([...researchTypes]),
    principalInvestigators: sortThai([...principalInvestigators]),
    fundingSources: sortThai([...fundingSources]),
  };
}

export function filterDashboardData(
  data: ProjectMapDashboardData,
  filters: ProjectMapFilters,
): ProjectMapDashboardData {
  const locationById = new Map(data.locations.map((item) => [item.locationId, item]));
  const projects = data.projects.filter((project) => {
    const locationFields = project.locationIds
      .map((locationId) => locationById.get(locationId))
      .filter(Boolean)
      .map((location) => ({
        tambon: location!.tambon,
        amphoe: location!.amphoe,
        province: location!.province,
      }));
    return projectMatchesFilters(project, locationFields, filters);
  });
  const projectIds = new Set(projects.map((item) => item.projectId));
  const features = data.features.filter((feature) => {
    if (!projectIds.has(feature.projectId)) return false;
    return (
      matchesAreaToken(feature.province, filters.province) &&
      matchesAreaToken(feature.amphoe, filters.amphoe) &&
      matchesAreaToken(feature.tambon, filters.tambon)
    );
  });
  const usedLocationIds = new Set(projects.flatMap((item) => item.locationIds));
  const locations = data.locations.filter((item) => {
    if (!usedLocationIds.has(item.locationId)) return false;
    return (
      matchesAreaToken(item.province, filters.province) &&
      matchesAreaToken(item.amphoe, filters.amphoe) &&
      matchesAreaToken(item.tambon, filters.tambon)
    );
  });

  const optionRows = projects.flatMap((project) =>
    project.locationIds
      .map((locationId) => locationById.get(locationId))
      .filter(Boolean)
      .map((location) => ({
        province: location!.province,
        amphoe: location!.amphoe,
        tambon: location!.tambon,
        fiscalYearBe: project.fiscalYearBe,
        sdg: project.sdg,
        researchGroup: project.researchGroup,
        researchType: project.researchType,
        principalInvestigator: project.principalInvestigator,
        researchers: project.linkedResearchers.map((item) => item.name),
        fundingSource: project.fundingSource,
      })),
  );

  return {
    projects,
    features,
    locations,
    filterOptions: buildCascadingFilterOptions(optionRows, {
      province: filters.province,
      amphoe: filters.amphoe,
    }),
    stats: {
      projectCount: projects.length,
      mappableFeatureCount: features.length,
      pendingLocationCount: projects.reduce((sum, item) => sum + item.pendingLocationCount, 0),
      domesticProjectCount: projects.filter((item) => item.hasDomesticLocation).length,
      internationalProjectCount: projects.filter((item) => item.hasInternationalLocation)
        .length,
    },
  };
}
