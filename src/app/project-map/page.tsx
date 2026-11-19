import { ProjectMapDashboard } from "@/components/project-map/ProjectMapDashboard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import { SITE_PAGE_KEYS } from "@/lib/analytics/site-pages";
import { incrementSitePageView } from "@/lib/analytics/views";
import { getProjectMapDashboardData } from "@/lib/project-map/repository";

export const revalidate = 300;

export default async function ProjectMapPage() {
  await incrementSitePageView(SITE_PAGE_KEYS.projectMap);
  const data = await getProjectMapDashboardData();

  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "พื้นที่วิจัย" },
        ]}
      />
      <main className="flex w-full flex-col items-center px-4 py-10 sm:px-6 md:px-10 lg:px-[60px] lg:py-14">
        <PageTitle>พื้นที่วิจัย</PageTitle>
        <p className="mt-4 max-w-4xl text-center text-base leading-relaxed text-brand-muted sm:text-lg">
          แผนที่แสดงพื้นที่ดำเนินโครงการวิจัย
        </p>
        <div className="mt-8 w-full">
          <ProjectMapDashboard data={data} />
        </div>
      </main>
    </>
  );
}
