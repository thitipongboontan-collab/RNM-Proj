import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FundingDeleteButton } from "@/components/admin/FundingDeleteButton";
import { getAdminSession } from "@/lib/admin/auth";
import { listAdminFundings } from "@/lib/admin/funding-admin";

type PageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function AdminFundingsPage({ searchParams }: PageProps) {
  const user = await getAdminSession();
  const { deleted } = await searchParams;
  const fundings = await listAdminFundings();

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="จัดการแหล่งทุน"
        description="เพิ่ม แก้ไข และลบข้อมูลแหล่งทุนวิจัย"
      />

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-muted">ทั้งหมด {fundings.length} รายการ</p>
          <Link
            href="/admin/fundings/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + เพิ่มแหล่งทุน
          </Link>
        </div>

        {deleted === "1" ? (
          <p className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            ลบแหล่งทุนเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F7F8FC] text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">รหัส</th>
                  <th className="px-4 py-3 font-medium">ชื่อทุน</th>
                  <th className="px-4 py-3 font-medium">หน่วยงาน</th>
                  <th className="px-4 py-3 font-medium">เปิดรับ</th>
                  <th className="px-4 py-3 font-medium">ปิดรับ</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {fundings.map((item) => (
                  <tr key={item.fundingId} className="border-t border-[#EEF1F6]">
                    <td className="px-4 py-3 font-medium text-brand-dark">{item.fundingId}</td>
                    <td className="px-4 py-3 text-brand-dark">{item.title}</td>
                    <td className="px-4 py-3 text-brand-muted">{item.organization}</td>
                    <td className="px-4 py-3 text-brand-muted">{item.openDate}</td>
                    <td className="px-4 py-3 text-brand-muted">{item.closeDate}</td>
                    <td className="px-4 py-3 text-brand-muted">{item.viewCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/fundings/${item.fundingId}/edit`}
                          className="rounded-lg border border-[#D9DEE8] px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
                        >
                          แก้ไข
                        </Link>
                        <Link
                          href={`/funding/${item.fundingId}`}
                          target="_blank"
                          className="rounded-lg border border-[#D9DEE8] px-3 py-1.5 text-xs font-medium text-brand-primary transition hover:bg-[#F3F5FA]"
                        >
                          ดูหน้าบ้าน
                        </Link>
                        <FundingDeleteButton fundingId={item.fundingId} title={item.title} />
                      </div>
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
