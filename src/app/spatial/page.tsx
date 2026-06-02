import { PageShell } from "@/components/layout/PageShell";
import { SpatialDashboard } from "@/components/spatial/SpatialDashboard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import { getSpatialDashboardData } from "@/lib/spatial-repository";

export const dynamic = "force-dynamic";

export default async function SpatialPage() {
  const data = await getSpatialDashboardData();

  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "เชิงพื้นที่" },
        ]}
      />
      <main className="flex flex-col items-center px-4 py-10 sm:px-8 lg:px-[60px] lg:py-14">
        <PageTitle>เชิงพื้นที่</PageTitle>
        <div className="mt-8 w-full">
          <SpatialDashboard data={data} />
        </div>
      </main>
    </PageShell>
  );
}
