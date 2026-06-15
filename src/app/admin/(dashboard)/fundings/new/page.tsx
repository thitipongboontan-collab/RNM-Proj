import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FundingAdminFormLoader } from "@/components/admin/FundingAdminFormLoader";
import { getAdminSession } from "@/lib/admin/auth";
import { getSuggestedFundingDefaults } from "@/lib/admin/funding-admin";

export default async function AdminFundingNewPage() {
  const user = await getAdminSession();
  const defaults = await getSuggestedFundingDefaults();

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="เพิ่มแหล่งทุน"
        description="กรอกข้อมูลแหล่งทุนใหม่และอัปโหลดไฟล์ที่เกี่ยวข้อง"
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <Link href="/admin/fundings" className="text-sm font-medium text-brand-primary hover:underline">
          ← กลับไปรายการแหล่งทุน
        </Link>
        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <FundingAdminFormLoader mode="create" defaults={defaults} />
        </div>
      </div>
    </>
  );
}
