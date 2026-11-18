import { NextResponse } from "next/server";
import { getFilteredProjectMapData } from "@/lib/project-map/repository";
import type { ProjectMapFilters } from "@/lib/project-map/types";

export const dynamic = "force-dynamic";

function readFilter(searchParams: URLSearchParams, key: keyof ProjectMapFilters) {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: ProjectMapFilters = {
    province: readFilter(searchParams, "province"),
    amphoe: readFilter(searchParams, "amphoe"),
    tambon: readFilter(searchParams, "tambon"),
    fiscalYear: readFilter(searchParams, "fiscalYear"),
    sdg: readFilter(searchParams, "sdg"),
    researchGroup: readFilter(searchParams, "researchGroup"),
    researchType: readFilter(searchParams, "researchType"),
    principalInvestigator: readFilter(searchParams, "principalInvestigator"),
    fundingSource: readFilter(searchParams, "fundingSource"),
    query: readFilter(searchParams, "query"),
  };

  try {
    const data = await getFilteredProjectMapData(filters);
    return NextResponse.json({
      stats: data.stats,
      filterOptions: data.filterOptions,
      projects: data.projects.map((project) => ({
        projectId: project.projectId,
        titleTh: project.titleTh,
        titleEn: project.titleEn,
        fiscalYearBe: project.fiscalYearBe,
        researchGroup: project.researchGroup,
        fundingSource: project.fundingSource,
        principalInvestigator: project.principalInvestigator,
        locationCount: project.locationCount,
        mappableLocationCount: project.mappableLocationCount,
        pendingLocationCount: project.pendingLocationCount,
        provinces: project.provinces,
      })),
      features: data.features,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "โหลดแผนที่โครงการไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
