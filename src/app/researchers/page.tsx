import {
  buildDepartmentFilters,
  getResearchers,
} from "@/lib/researchers-repository";
import { ResearchersPage } from "@/components/researchers/ResearchersPage";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ department?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { department } = await searchParams;
  const items = await getResearchers();
  const filters = buildDepartmentFilters(items);
  const activeDepartment =
    department && filters.some((filter) => filter.id === department)
      ? department
      : "all";

  return (
    <ResearchersPage
      items={items}
      filters={filters}
      activeDepartment={activeDepartment}
    />
  );
}
