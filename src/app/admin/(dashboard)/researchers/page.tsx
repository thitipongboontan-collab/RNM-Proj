import Link from "next/link";
import Image from "next/image";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResearcherDeleteButton } from "@/components/admin/ResearcherDeleteButton";
import { getAdminSession } from "@/lib/admin/auth";
import { listAdminResearchers } from "@/lib/admin/researcher-admin";
import { resolveResearcherImageSrc } from "@/lib/researcher-assets";

type PageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function AdminResearchersPage({ searchParams }: PageProps) {
  const user = await getAdminSession();
  const { deleted } = await searchParams;

  let researchers: Awaited<ReturnType<typeof listAdminResearchers>> = [];
  let setupError: string | null = null;

  try {
    researchers = await listAdminResearchers();
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "ยังไม่ได้สร้างตาราง researchers ใน Supabase";
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="จัดการนักวิจัย"
        description="เพิ่ม แก้ไข และลบข้อมูลนักวิจัย พร้อมรูปโปรไฟล์"
      />

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-muted">ทั้งหมด {researchers.length} รายการ</p>
          <Link
            href="/admin/researchers/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + เพิ่มนักวิจัย
          </Link>
        </div>

        {setupError ? (
          <p className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
            กรุณารัน SQL ใน Supabase จากไฟล์ `supabase/researchers-schema.sql` และ
            `supabase/researchers-image-path.sql` ก่อนใช้งาน ({setupError})
          </p>
        ) : null}

        {deleted === "1" ? (
          <p className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            ลบนักวิจัยเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F7F8FC] text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">รูป</th>
                  <th className="px-4 py-3 font-medium">รหัส</th>
                  <th className="px-4 py-3 font-medium">ชื่อ</th>
                  <th className="px-4 py-3 font-medium">สังกัด</th>
                  <th className="px-4 py-3 font-medium">Output</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {researchers.length ? (
                  researchers.map((item) => {
                    const imageSrc = resolveResearcherImageSrc(item.researcherId, item.imagePath);

                    return (
                      <tr key={item.researcherId} className="border-t border-[#EEF1F6]">
                        <td className="px-4 py-3">
                          {imageSrc ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#F3F5FA]">
                              <Image
                                src={imageSrc}
                                alt={item.nameTh}
                                fill
                                className="object-cover"
                                unoptimized={item.imagePath?.startsWith("http") ?? false}
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5FA] text-xs text-brand-muted">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-dark">{item.researcherId}</td>
                        <td className="max-w-xs px-4 py-3 text-brand-dark">{item.nameTh}</td>
                        <td className="px-4 py-3 text-brand-muted">{item.department}</td>
                        <td className="px-4 py-3 text-brand-muted">{item.scholarlyOutput}</td>
                        <td className="px-4 py-3 text-brand-muted">{item.viewCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/researchers/${item.researcherId}/edit`}
                              className="rounded-lg border border-[#D9DEE8] px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
                            >
                              แก้ไข
                            </Link>
                            <ResearcherDeleteButton
                              researcherId={item.researcherId}
                              name={item.nameTh}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                      ยังไม่มีนักวิจัยในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-brand-muted">
          ดูหน้าสาธารณะ:{" "}
          <Link href="/researchers" className="font-medium text-brand-primary hover:underline">
            นักวิจัย
          </Link>
        </p>
      </div>
    </>
  );
}
