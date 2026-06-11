import { SpatialDashboard } from "@/components/spatial/SpatialDashboard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import { getSpatialDashboardData } from "@/lib/spatial-repository";

export const revalidate = 300;

export default async function SpatialPage() {
  const data = await getSpatialDashboardData();

  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "เชิงพื้นที่" },
        ]}
      />
      <main className="flex w-full flex-col items-center px-2 py-10 sm:px-4 lg:px-6 lg:py-14">
        <PageTitle>เชิงพื้นที่</PageTitle>
        <p className="mt-4 max-w-4xl text-center text-base leading-relaxed text-brand-muted sm:text-lg">
          แผนที่ความร่วมมือทางวิชาการ (Academic Collaboration Map)
          แสดงเครือข่ายความร่วมมือทางวิชาการของนักวิจัยในรูปแบบเชิงพื้นที่
          เพื่อให้เห็นการกระจายตัวและจำนวนความร่วมมือทางวิชาการของนักวิจัยในแต่ละพื้นที่
          และสามารถวิเคราะห์แนวโน้มการเชื่อมโยงทางวิชาการ
          และค้นหาโอกาสในการสร้างความร่วมมือใหม่ในอนาคต
        </p>
        <div className="mt-8 w-full">
          <SpatialDashboard data={data} />
        </div>
      </main>
    </>
  );
}
