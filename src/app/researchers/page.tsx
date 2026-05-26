import {
  buildDepartmentFilters,
  getResearchers,
} from "@/lib/researchers-repository";
import { ResearchersPage } from "@/components/researchers/ResearchersPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const items = await getResearchers();

  return (
    <ResearchersPage
      items={items}
      filters={buildDepartmentFilters(items)}
    />
  );
}
