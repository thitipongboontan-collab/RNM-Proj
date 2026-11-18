import assert from "node:assert/strict";
import { filterDashboardData, projectMatchesFilters } from "@/lib/project-map/filters";
import type { ProjectMapDashboardData, ProjectMapListItem } from "@/lib/project-map/types";
import {
  buildResearcherLookup,
  matchProjectResearchers,
} from "@/lib/project-map/researcher-match";
import { formatOperatingAreaLabel } from "@/lib/project-map/operating-area";
import {
  canMapGeometry,
  isValidGeoJsonGeometry,
  isValidLatitude,
  isValidLongitude,
  classifyAreaScope,
  matchesAreaToken,
  resolveGeometryType,
} from "@/lib/project-map/validation";

function sampleProject(overrides: Partial<ProjectMapListItem> = {}): ProjectMapListItem {
  return {
    projectId: "PRJ-1",
    titleTh: "โครงการตัวอย่างเชียงใหม่",
    titleEn: "Sample Chiang Mai Project",
    fiscalYearBe: 2567,
    sdg: "เป้าหมายที่ 13",
    strategy: "อื่นๆ",
    researchGroup: "กลุ่ม A",
    researchType: "งานวิจัยและพัฒนา",
    fundingSource: "วช.",
    principalInvestigator: "ดร. ทดสอบ",
    coInvestigators: "",
    linkedResearchers: [
      {
        researcherId: "RS001",
        name: "ทดสอบ",
        role: "principal",
        roleLabel: "หัวหน้าโครงการ",
      },
    ],
    locationCount: 1,
    mappableLocationCount: 1,
    pendingLocationCount: 0,
    provinces: ["เชียงใหม่"],
    locationIds: ["LOC-1"],
    operatingAreas: [
      {
        areaName: "",
        tambon: "ศรีภูมิ",
        amphoe: "เมืองเชียงใหม่",
        province: "เชียงใหม่",
        region: "ภาคเหนือ",
        country: "ไทย",
      },
    ],
    hasDomesticLocation: true,
    hasInternationalLocation: false,
    ...overrides,
  };
}

const baseData: ProjectMapDashboardData = {
  projects: [
    sampleProject(),
    sampleProject({
      projectId: "PRJ-2",
      titleTh: "โครงการลำพูน",
      provinces: ["ลำพูน"],
      locationIds: ["LOC-2"],
      fiscalYearBe: 2566,
      mappableLocationCount: 0,
      pendingLocationCount: 1,
      hasDomesticLocation: true,
      hasInternationalLocation: false,
    }),
    sampleProject({
      projectId: "PRJ-3",
      titleTh: "โครงการหลายพื้นที่",
      provinces: ["เชียงใหม่", "ลำพูน"],
      locationIds: ["LOC-1", "LOC-2"],
      locationCount: 2,
      mappableLocationCount: 1,
      pendingLocationCount: 1,
      hasDomesticLocation: true,
      hasInternationalLocation: false,
    }),
  ],
  features: [
    {
      featureId: "RNX-1:LOC-1",
      projectId: "PRJ-1",
      locationId: "LOC-1",
      projectLocationId: "RNX-1",
      titleTh: "โครงการตัวอย่างเชียงใหม่",
      geometryType: "Point",
      latitude: 18.78,
      longitude: 98.98,
      geojson: { type: "Point", coordinates: [98.98, 18.78] },
      province: "เชียงใหม่",
      amphoe: "เมืองเชียงใหม่",
      tambon: "ศรีภูมิ",
    },
    {
      featureId: "RNX-3:LOC-1",
      projectId: "PRJ-3",
      locationId: "LOC-1",
      projectLocationId: "RNX-3",
      titleTh: "โครงการหลายพื้นที่",
      geometryType: "Polygon",
      latitude: null,
      longitude: null,
      geojson: {
        type: "Polygon",
        coordinates: [
          [
            [98.9, 18.7],
            [99.0, 18.7],
            [99.0, 18.8],
            [98.9, 18.8],
            [98.9, 18.7],
          ],
        ],
      },
      province: "เชียงใหม่",
      amphoe: "เมืองเชียงใหม่",
      tambon: "",
    },
  ],
  locations: [
    {
      locationId: "LOC-1",
      areaName: "",
      tambon: "ศรีภูมิ",
      amphoe: "เมืองเชียงใหม่",
      province: "เชียงใหม่",
      country: "Thailand",
      region: "",
      verificationStatus: "verified",
      hasMappableGeometry: true,
      geometryType: "Point",
      latitude: 18.78,
      longitude: 98.98,
      geojson: { type: "Point", coordinates: [98.98, 18.78] },
    },
    {
      locationId: "LOC-2",
      areaName: "",
      tambon: "ในเมือง",
      amphoe: "เมืองลำพูน",
      province: "ลำพูน",
      country: "Thailand",
      region: "",
      verificationStatus: "pending",
      hasMappableGeometry: false,
      geometryType: null,
      latitude: null,
      longitude: null,
      geojson: null,
    },
  ],
  filterOptions: {
    provinces: ["เชียงใหม่", "ลำพูน"],
    amphoes: ["เมืองเชียงใหม่", "เมืองลำพูน"],
    tambons: ["ศรีภูมิ", "ในเมือง"],
    fiscalYears: ["2567", "2566"],
    sdgs: ["เป้าหมายที่ 13"],
    researchGroups: ["กลุ่ม A"],
    researchTypes: ["งานวิจัยและพัฒนา"],
    principalInvestigators: ["ดร. ทดสอบ"],
    fundingSources: ["วช."],
  },
  stats: {
    projectCount: 3,
    mappableFeatureCount: 2,
    pendingLocationCount: 2,
    domesticProjectCount: 3,
    internationalProjectCount: 0,
  },
};

assert.equal(isValidLatitude(18.78), true);
assert.equal(isValidLatitude(120), false);
assert.equal(isValidLongitude(98.98), true);
assert.equal(isValidLongitude(200), false);

assert.equal(
  isValidGeoJsonGeometry({
    type: "Polygon",
    coordinates: [
      [
        [98.9, 18.7],
        [99.0, 18.7],
        [99.0, 18.8],
        [98.9, 18.8],
        [98.9, 18.7],
      ],
    ],
  }),
  true,
);
assert.equal(isValidGeoJsonGeometry({ type: "Polygon", coordinates: [[[1, 2]]] }), false);

assert.equal(
  resolveGeometryType({
    verificationStatus: "verified",
    latitude: 18.7,
    longitude: 98.9,
    geojson: null,
  }),
  "Point",
);
assert.equal(
  canMapGeometry({
    verificationStatus: "pending",
    latitude: 18.7,
    longitude: 98.9,
    geojson: null,
  }),
  false,
  "unverified coordinates must not map",
);

assert.deepEqual(classifyAreaScope({ country: "ไทย", province: "เชียงใหม่" }), {
  domestic: true,
  international: false,
});
assert.deepEqual(classifyAreaScope({ country: "ลาว", areaName: "สปป. ลาว" }), {
  domestic: false,
  international: true,
});
assert.deepEqual(classifyAreaScope({ country: "ไทย, อินเดีย" }), {
  domestic: true,
  international: true,
});
assert.deepEqual(
  classifyAreaScope({
    country: "",
    province: "",
    titleTh: "ผลกระทบของทุนจีนต่อประเทศไทย",
  }),
  { domestic: true, international: false },
);
assert.deepEqual(
  classifyAreaScope({
    country: "",
    province: "",
    titleTh: "ปรัชญาว่าด้วยส่วนรวมของสปิโนซา",
  }),
  { domestic: false, international: false },
);
assert.deepEqual(
  classifyAreaScope({
    titleTh: "กรณีศึกษาในประเทศลาว และเมียนมาร์",
  }),
  { domestic: false, international: true },
);

assert.equal(matchesAreaToken("เชียงใหม่, ลำพูน", "เชียงใหม่"), true);
assert.equal(matchesAreaToken("เชียงใหม่, ลำพูน", "น่าน"), false);

assert.equal(
  projectMatchesFilters(
    sampleProject(),
    [{ province: "เชียงใหม่", amphoe: "เมืองเชียงใหม่", tambon: "ศรีภูมิ" }],
    { province: "เชียงใหม่", amphoe: "เมืองเชียงใหม่" },
  ),
  true,
);

const filteredProvince = filterDashboardData(baseData, { province: "ลำพูน" });
assert.equal(filteredProvince.stats.projectCount, 2);
assert.ok(filteredProvince.projects.every((item) => item.provinces.includes("ลำพูน")));
assert.equal(
  filteredProvince.features.length,
  0,
  "ลำพูน has no mappable features in sample",
);

const filteredPoint = filterDashboardData(baseData, { province: "เชียงใหม่" });
assert.ok(filteredPoint.features.some((item) => item.geometryType === "Point"));
assert.ok(filteredPoint.features.some((item) => item.geometryType === "Polygon"));

const multiProject = filteredPoint.projects.find((item) => item.projectId === "PRJ-3");
assert.ok(multiProject);
assert.equal(multiProject.locationCount, 2);
assert.equal(multiProject.mappableLocationCount, 1);
assert.equal(multiProject.pendingLocationCount, 1);

assert.deepEqual(filteredProvince.filterOptions.amphoes, ["เมืองลำพูน"]);
assert.deepEqual(filteredProvince.filterOptions.principalInvestigators, ["ทดสอบ"]);
assert.equal(
  projectMatchesFilters(sampleProject(), [{ province: "เชียงใหม่", amphoe: "เมืองเชียงใหม่", tambon: "ศรีภูมิ" }], {
    principalInvestigator: "ทดสอบ",
  }),
  true,
);
assert.equal(
  projectMatchesFilters(sampleProject(), [{ province: "เชียงใหม่", amphoe: "เมืองเชียงใหม่", tambon: "ศรีภูมิ" }], {
    principalInvestigator: "ดร. ทดสอบ",
  }),
  false,
);

const lookup = buildResearcherLookup([
  { researcherId: "RS001", nameTh: "เสถียร ฉันทะ", nameEn: "Sathian Chanta" },
]);
const matchedPi = matchProjectResearchers({
  principalInvestigator: "ดร. เสถียร ฉันทะ",
  coInvestigators: "",
  lookup,
});
assert.equal(matchedPi.length, 1);
assert.equal(matchedPi[0].roleLabel, "หัวหน้าโครงการ");

const matchedCo = matchProjectResearchers({
  principalInvestigator: "นักวิจัยนอกระบบ",
  coInvestigators: "Sathian Chanta",
  lookup,
});
assert.equal(matchedCo.length, 1);
assert.equal(matchedCo[0].role, "collaborator");

assert.equal(
  matchProjectResearchers({
    principalInvestigator: "ไม่มีในระบบ",
    coInvestigators: "",
    lookup,
  }).length,
  0,
);

assert.equal(
  formatOperatingAreaLabel({
    areaName: "",
    tambon: "ศรีภูมิ",
    amphoe: "เมืองเชียงใหม่",
    province: "เชียงใหม่",
    region: "ภาคเหนือ",
    country: "ไทย",
  }),
  "(พื้นที่ดำเนินโครงการ: ศรีภูมิ, เมืองเชียงใหม่, เชียงใหม่)",
);
assert.equal(
  formatOperatingAreaLabel({
    areaName: "",
    tambon: "",
    amphoe: "",
    province: "",
    region: "ภาคเหนือ",
    country: "ไทย",
  }),
  "(พื้นที่ดำเนินโครงการ: ภาคเหนือ)",
);
assert.equal(
  formatOperatingAreaLabel({
    areaName: "",
    tambon: "",
    amphoe: "",
    province: "",
    region: "",
    country: "ไทย",
  }),
  "(พื้นที่ดำเนินโครงการ: ประเทศไทย)",
);

console.log("project-map tests passed");
