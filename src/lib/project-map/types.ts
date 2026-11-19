export type GeoJsonValue = {
  type: string;
  coordinates?: unknown;
  geometries?: unknown;
};

export type GeometryType = "Point" | "Polygon" | "MultiPolygon";

export type VerificationStatus =
  | "pending"
  | "verified"
  | "failed"
  | "wide_area"
  | "multi_area"
  | "needs_split";

export type ProjectMapFilters = {
  province?: string;
  amphoe?: string;
  tambon?: string;
  fiscalYear?: string;
  sdg?: string;
  researchGroup?: string;
  researchType?: string;
  principalInvestigator?: string;
  fundingSource?: string;
  query?: string;
};

export type ProjectMapLocationSummary = {
  locationId: string;
  areaName: string;
  tambon: string;
  amphoe: string;
  province: string;
  country: string;
  region: string;
  verificationStatus: VerificationStatus;
  hasMappableGeometry: boolean;
  geometryType: GeometryType | null;
  latitude: number | null;
  longitude: number | null;
  geojson: GeoJsonValue | null;
};

export type ProjectMapResearcher = {
  researcherId: string;
  name: string;
  role: "principal" | "collaborator";
  roleLabel: string;
};

export type ProjectMapOperatingArea = {
  areaName: string;
  tambon: string;
  amphoe: string;
  province: string;
  region: string;
  country: string;
};

export type ProjectMapListItem = {
  projectId: string;
  titleTh: string;
  titleEn: string;
  fiscalYearBe: number | null;
  startYearBe: number | null;
  endYearBe: number | null;
  sdg: string;
  strategy: string;
  researchGroup: string;
  researchType: string;
  fundingSource: string;
  principalInvestigator: string;
  coInvestigators: string;
  linkedResearchers: ProjectMapResearcher[];
  locationCount: number;
  mappableLocationCount: number;
  pendingLocationCount: number;
  provinces: string[];
  locationIds: string[];
  operatingAreas: ProjectMapOperatingArea[];
  hasDomesticLocation: boolean;
  hasInternationalLocation: boolean;
};

export type ProjectMapFeature = {
  featureId: string;
  projectId: string;
  locationId: string;
  projectLocationId: string;
  titleTh: string;
  geometryType: GeometryType;
  latitude: number | null;
  longitude: number | null;
  geojson: GeoJsonValue | null;
  province: string;
  amphoe: string;
  tambon: string;
};

export type ProjectMapDetail = {
  projectId: string;
  titleTh: string;
  titleEn: string;
  fiscalYearBe: number | null;
  sdg: string;
  strategy: string;
  researchGroup: string;
  researchType: string;
  startYearBe: number | null;
  endYearBe: number | null;
  fundingKind: string;
  fundingSource: string;
  principalInvestigator: string;
  coInvestigators: string;
  linkedResearchers: ProjectMapResearcher[];
  locations: Array<{
    projectLocationId: string;
    locationId: string;
    areaName: string;
    tambon: string;
    amphoe: string;
    province: string;
    country: string;
    region: string;
    verificationStatus: VerificationStatus;
    positionLabel: string;
    geometryType: GeometryType | null;
    latitude: number | null;
    longitude: number | null;
    geojson: GeoJsonValue | null;
  }>;
};

export type ProjectMapFilterOptions = {
  provinces: string[];
  amphoes: string[];
  tambons: string[];
  fiscalYears: string[];
  sdgs: string[];
  researchGroups: string[];
  researchTypes: string[];
  principalInvestigators: string[];
  fundingSources: string[];
};

export type ProjectMapDashboardData = {
  projects: ProjectMapListItem[];
  features: ProjectMapFeature[];
  locations: ProjectMapLocationSummary[];
  filterOptions: ProjectMapFilterOptions;
  stats: {
    projectCount: number;
    mappableFeatureCount: number;
    pendingLocationCount: number;
    domesticProjectCount: number;
    internationalProjectCount: number;
  };
};
