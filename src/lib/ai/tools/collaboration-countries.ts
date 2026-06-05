import {
  getOrganizationCountryMap,
  resolveOrganizationCountry,
} from "@/lib/ai/organization-locations";
import { applyResearcherFilters } from "@/lib/ai/tools/researcher-filters";
import type { Citation, ResearcherFilters, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset, ResearcherRecord } from "@/lib/assistant-context";

function researcherCitation(record: ResearcherRecord): Citation {
  return {
    id: record.row.researcher_id,
    type: "researcher",
    label: record.row.name_th,
    href: `/researchers/${record.row.researcher_id}`,
  };
}

function summarizeResearcherCountries(record: ResearcherRecord, countryMap: Map<string, string>) {
  const countries = new Set<string>();
  const unmappedOrganizations: string[] = [];

  for (const collaboration of record.collaborations) {
    const organizationName = collaboration.organization_name;
    if (!organizationName || organizationName === "-") continue;

    const country = resolveOrganizationCountry(organizationName, countryMap);
    if (country) {
      countries.add(country);
    } else {
      unmappedOrganizations.push(organizationName);
    }
  }

  return {
    countries: [...countries].sort((a, b) => a.localeCompare(b)),
    countryCount: countries.size,
    organizationCount: record.collaborations.filter(
      (item) => item.organization_name && item.organization_name !== "-",
    ).length,
    unmappedOrganizations: [...new Set(unmappedOrganizations)].sort((a, b) => a.localeCompare(b)),
  };
}

export function collaborationCountriesTool(
  dataset: AssistantDataset,
  filters: ResearcherFilters,
): ToolExecutionResult {
  const countryMap = getOrganizationCountryMap();
  const filtered = applyResearcherFilters(dataset.researchers, filters);

  if (!filtered.length) {
    return {
      name: "collaboration_countries",
      summary: "ไม่พบนักวิจัยตามเงื่อนไข",
      contextBlock: "=== TOOL: collaboration_countries ===\n- ไม่พบนักวิจัยตามเงื่อนไข",
      citations: [],
    };
  }

  const perResearcher = filtered
    .map((record) => ({
      record,
      ...summarizeResearcherCountries(record, countryMap),
    }))
    .sort((a, b) => {
      if (b.countryCount !== a.countryCount) return b.countryCount - a.countryCount;
      return b.organizationCount - a.organizationCount;
    });

  const allCountries = new Set<string>();
  for (const item of perResearcher) {
    for (const country of item.countries) allCountries.add(country);
  }

  const filterDescription = [
    filters.researcherId ? `researcher_id=${filters.researcherId}` : null,
    filters.department ? `ภาควิชา ${filters.department}` : null,
    filters.titles.length ? `ตำแหน่ง ${filters.titles.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const singleResearcher = filters.researcherId && perResearcher.length === 1 ? perResearcher[0] : null;

  const detailLines = singleResearcher
    ? [
        `นักวิจัย: [${singleResearcher.record.row.researcher_id}] ${singleResearcher.record.row.name_th}`,
        `จำนวนประเทศที่มีเครือข่ายความร่วมมือ: ${singleResearcher.countryCount} ประเทศ`,
        `จำนวนหน่วยงานความร่วมมือ: ${singleResearcher.organizationCount} หน่วยงาน`,
        singleResearcher.countries.length
          ? `รายชื่อประเทศ: ${singleResearcher.countries.join(", ")}`
          : "- ไม่พบประเทศที่ map ได้จากหน่วยงานความร่วมมือ",
        singleResearcher.unmappedOrganizations.length
          ? `หน่วยงานที่ยัง map ประเทศไม่ได้ (${singleResearcher.unmappedOrganizations.length}): ${singleResearcher.unmappedOrganizations.slice(0, 8).join(", ")}`
          : "",
      ].filter(Boolean)
    : [
        `จำนวนประเทศที่มีเครือข่ายความร่วมมือรวมทั้งหมด: ${allCountries.size} ประเทศ`,
        `จำนวนนักวิจัยในชุดข้อมูล: ${perResearcher.length} คน`,
        allCountries.size
          ? `รายชื่อประเทศทั้งหมด: ${[...allCountries].sort((a, b) => a.localeCompare(b)).join(", ")}`
          : "- ไม่พบประเทศที่ map ได้",
        "",
        "=== จำนวนประเทศต่อนักวิจัย ===",
        ...perResearcher.map(
          (item) =>
            `- [${item.record.row.researcher_id}] ${item.record.row.name_th}: ${item.countryCount} ประเทศ (${item.countries.join(", ") || "—"})`,
        ),
      ];

  return {
    name: "collaboration_countries",
    summary: singleResearcher
      ? `${singleResearcher.record.row.name_th} มีเครือข่ายใน ${singleResearcher.countryCount} ประเทศ`
      : `เครือข่ายความร่วมมือครอบคลุม ${allCountries.size} ประเทศ`,
    contextBlock: [
      "=== TOOL: collaboration_countries (map จาก collaboration_organization_locations) ===",
      filterDescription ? `เงื่อนไข: ${filterDescription}` : "เงื่อนไข: นักวิจัยทั้งหมด",
      "นิยามการนับ: นับประเทศแบบไม่ซ้ำจากหน่วยงานความร่วมมือของแต่ละนักวิจัย",
      "",
      ...detailLines,
    ].join("\n"),
    citations: perResearcher.slice(0, 12).map((item) => researcherCitation(item.record)),
  };
}
