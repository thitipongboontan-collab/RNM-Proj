import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewsAdminFormLoader } from "@/components/admin/NewsAdminFormLoader";
import { getAdminSession } from "@/lib/admin/auth";

export default async function AdminNewsNewPage() {
  const user = await getAdminSession();

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="เพิ่มข่าวสาร"
        description="กรอกข้อมูลข่าวสารใหม่สำหรับแสดงบนหน้าแรก"
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <Link href="/admin/news" className="text-sm font-medium text-brand-primary hover:underline">
          ← กลับไปรายการข่าวสาร
        </Link>
        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <NewsAdminFormLoader mode="create" />
        </div>
      </div>
    </>
  );
}
