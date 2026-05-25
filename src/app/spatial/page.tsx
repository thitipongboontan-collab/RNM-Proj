import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";

export default function SpatialPage() {
  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "เชิงพื้นที่" },
        ]}
      />
      <main className="flex min-h-[500px] flex-col items-center justify-center px-[60px] py-20 text-center">
        <PageTitle>เชิงพื้นที่</PageTitle>
        <p className="mt-4 max-w-lg text-xl text-brand-muted">
          กำลังพัฒนาหน้าแผนที่จาก Figma (node 145:649)
        </p>
      </main>
    </PageShell>
  );
}
