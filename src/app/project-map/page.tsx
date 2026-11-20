import { ProjectMapDashboard } from "@/components/project-map/ProjectMapDashboard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageLead, PageTitle } from "@/components/ui/PageTitle";
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
        <div className="flex flex-col items-center gap-3 text-center">
          <PageTitle>พื้นที่วิจัย (Research Area)</PageTitle>
          <PageLead>
            รวบรวมและนำเสนอข้อมูลพื้นที่ดำเนินงานวิจัยของนักวิจัยและโครงการต่าง ๆ แสดงเป็นแผนที่เชิงภูมิศาสตร์ ช่วยให้เห็นการกระจายตัวของงานวิจัย เครือข่ายความร่วมมือ และโอกาสในการต่อยอดงานวิจัยในระดับพื้นที่
          </PageLead>
        </div>
        <div className="mt-8 w-full">
          <ProjectMapDashboard data={data} />
        </div>
      </main>
    </>
  );
}
