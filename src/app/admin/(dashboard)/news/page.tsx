import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewsDeleteButton } from "@/components/admin/NewsDeleteButton";
import { getAdminSession } from "@/lib/admin/auth";
import { listAdminNews } from "@/lib/admin/news-admin";

type PageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function AdminNewsPage({ searchParams }: PageProps) {
  const user = await getAdminSession();
  const { deleted } = await searchParams;

  let news: Awaited<ReturnType<typeof listAdminNews>> = [];
  let setupError: string | null = null;

  try {
    news = await listAdminNews();
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "ยังไม่ได้สร้างตาราง research_news ใน Supabase";
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="จัดการข่าวสาร"
        description="เพิ่ม แก้ไข และลบข่าวสารงานวิจัยสำหรับหน้าแรก"
      />

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-muted">ทั้งหมด {news.length} รายการ</p>
          <Link
            href="/admin/news/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + เพิ่มข่าวสาร
          </Link>
        </div>

        {setupError ? (
          <p className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
            กรุณารัน SQL ใน Supabase จากไฟล์ `supabase/research-news-schema.sql` ก่อนใช้งาน
            ({setupError})
          </p>
        ) : null}

        {deleted === "1" ? (
          <p className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            ลบข่าวเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F7F8FC] text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">รหัส</th>
                  <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                  <th className="px-4 py-3 font-medium">หัวข้อ</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {news.length ? (
                  news.map((item) => (
                    <tr key={item.newsId} className="border-t border-[#EEF1F6]">
                      <td className="px-4 py-3 font-medium text-brand-dark">{item.newsId}</td>
                      <td className="px-4 py-3 text-brand-muted">{item.category}</td>
                      <td className="max-w-xs px-4 py-3 text-brand-dark">{item.title}</td>
                      <td className="px-4 py-3 text-brand-muted">{item.publishedDate}</td>
                      <td className="px-4 py-3 text-brand-muted">{item.viewCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/news/${item.newsId}/edit`}
                            className="rounded-lg border border-[#D9DEE8] px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
                          >
                            แก้ไข
                          </Link>
                          <NewsDeleteButton newsId={item.newsId} title={item.title} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                      ยังไม่มีข่าวในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-brand-muted">
          ดูบนหน้าแรก:{" "}
          <Link href="/" className="font-medium text-brand-primary hover:underline">
            Research Nexus Matching
          </Link>
        </p>
      </div>
    </>
  );
}
