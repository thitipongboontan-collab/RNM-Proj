import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResearcherAdminFormLoader } from "@/components/admin/ResearcherAdminFormLoader";
import { getAdminSession } from "@/lib/admin/auth";

export default async function AdminResearcherNewPage() {
  const user = await getAdminSession();

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="เพิ่มนักวิจัย"
        description="กรอกข้อมูลนักวิจัยใหม่สำหรับแสดงบนหน้าสาธารณะ"
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <Link
          href="/admin/researchers"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          ← กลับไปรายการนักวิจัย
        </Link>
        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <ResearcherAdminFormLoader mode="create" />
        </div>
      </div>
    </>
  );
}
