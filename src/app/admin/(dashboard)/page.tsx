import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession } from "@/lib/admin/auth";
import { getFundingSummaries } from "@/lib/funding-repository";
import { getResearchers } from "@/lib/researchers-repository";
import { getResearchNewsCount } from "@/lib/research-news-repository";

export default async function AdminDashboardPage() {
  const [user, fundings, researchers, newsCount] = await Promise.all([
    getAdminSession(),
    getFundingSummaries(),
    getResearchers(),
    getResearchNewsCount(),
  ]);

  const stats = [
    {
      label: "แหล่งทุน",
      value: fundings.length,
      hint: "จัดการได้ที่เมนูแหล่งทุน",
    },
    {
      label: "ข่าวสาร",
      value: newsCount,
      hint: "จัดการได้ที่เมนูข่าวสาร",
    },
    {
      label: "นักวิจัย",
      value: researchers.length,
      hint: "Phase 2 จะเพิ่ม CRUD",
    },
  ];

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="ภาพรวมระบบ"
        description="จัดการข้อมูลแหล่งทุน ข่าวสาร และนักวิจัยจากหลังบ้าน"
      />

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-brand-muted">{stat.label}</p>
              <p className="mt-2 text-4xl font-bold text-brand-dark">{stat.value}</p>
              <p className="mt-2 text-sm text-brand-muted">{stat.hint}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-dark">สถานะระบบ</h3>
          <ul className="mt-4 space-y-3 text-sm text-brand-muted">
            <li>✓ Login / Logout ด้วย Supabase Auth</li>
            <li>✓ ป้องกันเส้นทาง `/admin` ด้วย middleware</li>
            <li>✓ Admin layout แยกจากหน้าบ้าน</li>
            <li>✓ Phase 1: จัดการแหล่งทุน (CRUD + upload)</li>
            <li>✓ Phase 2: จัดการข่าวสาร (CRUD + แสดงหน้าแรก)</li>
            <li>→ Phase 3: จัดการนักวิจัย (CRUD + รูปโปรไฟล์)</li>
          </ul>
        </section>

        <p className="text-sm text-brand-muted">
          กลับไปหน้าบ้าน:{" "}
          <Link href="/" className="font-medium text-brand-primary hover:underline">
            Research Nexus Matching
          </Link>
        </p>
      </div>
    </>
  );
}
