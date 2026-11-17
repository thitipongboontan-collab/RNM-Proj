import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession } from "@/lib/admin/auth";
import { listExpertiseAdmin } from "@/lib/expertise/repository";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ai_analyzed: "AI Analyzed",
  needs_review: "Needs Review",
  approved: "Approved",
  rejected: "Rejected",
  insufficient_evidence: "Insufficient Evidence",
};

export default async function AdminExpertisePage() {
  const user = await getAdminSession();
  let rows: Awaited<ReturnType<typeof listExpertiseAdmin>> = [];
  let setupError: string | null = null;

  try {
    rows = await listExpertiseAdmin();
  } catch (error) {
    setupError = error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ";
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="ตรวจทานความเชี่ยวชาญ"
        description="โปรไฟล์นี้แยกจากความเชี่ยวชาญที่กรอกมือ และฉบับที่อนุมัติแล้วจะไม่ถูกทับเมื่อวิเคราะห์รอบใหม่"
      />
      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        {setupError ? (
          <p className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
            รัน `supabase/researcher-expertise-profiles-schema.sql` ใน Supabase ก่อนใช้งาน ({setupError})
          </p>
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F7F8FC] text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">รหัส</th>
                  <th className="px-4 py-3 font-medium">ชื่อ</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">แหล่งที่แสดง</th>
                  <th className="px-4 py-3 font-medium">วิเคราะห์ล่าสุด</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.researcherId} className="border-t border-[#E5E7EF]">
                    <td className="px-4 py-3">{row.researcherId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-dark">{row.nameTh}</p>
                      <p className="text-xs text-brand-muted">{row.department}</p>
                    </td>
                    <td className="px-4 py-3">{STATUS_LABELS[row.status] ?? row.status}</td>
                    <td className="px-4 py-3">{row.displayOrigin ?? "—"}</td>
                    <td className="px-4 py-3">{row.analyzedAt?.slice(0, 10) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/expertise/${row.researcherId}`}
                        className="font-medium text-brand-primary hover:underline"
                      >
                        ตรวจทาน
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
