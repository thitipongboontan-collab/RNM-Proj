import { Suspense } from "react";
import { ResearchersPage } from "@/components/researchers/ResearchersPage";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";
import { SITE_PAGE_KEYS } from "@/lib/analytics/site-pages";
import { incrementSitePageView } from "@/lib/analytics/views";
import {
  buildDepartmentFilters,
  getResearchers,
} from "@/lib/researchers-repository";

export const revalidate = 300;

export default async function Page() {
  await incrementSitePageView(SITE_PAGE_KEYS.researchers);
  const items = await getResearchers();
  const filters = buildDepartmentFilters(items);

  return (
    <Suspense fallback={<RouteLoadingSkeleton titleWidth="10rem" />}>
      <ResearchersPage items={items} filters={filters} />
    </Suspense>
  );
}
