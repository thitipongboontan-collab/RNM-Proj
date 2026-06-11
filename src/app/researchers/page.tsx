import { Suspense } from "react";
import {
  buildDepartmentFilters,
  getResearchers,
} from "@/lib/researchers-repository";
import { ResearchersPage } from "@/components/researchers/ResearchersPage";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";

export const revalidate = 300;

export default async function Page() {
  const items = await getResearchers();
  const filters = buildDepartmentFilters(items);

  return (
    <Suspense fallback={<RouteLoadingSkeleton titleWidth="10rem" />}>
      <ResearchersPage items={items} filters={filters} />
    </Suspense>
  );
}
