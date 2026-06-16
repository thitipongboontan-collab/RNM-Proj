import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminAnalyticsSummary } from "@/lib/admin/analytics-admin";

function formatNumber(value: number): string {
  return value.toLocaleString("th-TH");
}

function TopList({
  title,
  items,
  hrefPrefix,
  emptyText,
}: {
  title: string;
  items: { id: string; title: string; viewCount: number }[];
  hrefPrefix: string;
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      {items.length ? (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-b border-[#EEF1F6] pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-brand-muted">#{index + 1}</p>
                <Link
                  href={`${hrefPrefix}/${item.id}`}
                  target="_blank"
                  className="mt-1 block truncate text-sm font-medium text-brand-primary hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-brand-muted">{item.id}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-[#F7F8FC] px-3 py-1 text-sm font-semibold text-brand-dark">
                {formatNumber(item.viewCount)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">{emptyText}</p>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const user = await getAdminSession();

  let summary: Awaited<ReturnType<typeof getAdminAnalyticsSummary>> | null = null;
  let setupError: string | null = null;

  try {
    summary = await getAdminAnalyticsSummary();
  } catch (error) {
    setupError =
      error instanceof Error ? error.message : "ยังไม่ได้ตั้งค่าตารางสถิติใน Supabase";
  }

  const statCards = summary
    ? [
        { label: "เข้าชมหน้าเว็บ", value: summary.totalPageViews, hint: "หน้าแรกและหน้ารายการหลัก" },
        { label: "เปิดดูข่าว", value: summary.totalNewsViews, hint: "รวมทุกข่าว" },
        { label: "เปิดดูทุน", value: summary.totalFundingViews, hint: "รวมทุกแหล่งทุน" },
        { label: "เปิดดูนักวิจัย", value: summary.totalResearcherViews, hint: "รวมทุกโปรไฟล์" },
      ]
    : [];

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="สถิติการใช้งาน"
        description="สรุปจำนวนการเข้าชมหน้าเว็บและการเปิดดูเนื้อหาบนหน้าบ้าน"
      />

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        {setupError ? (
          <p className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
            กรุณารัน SQL ใน Supabase จากไฟล์ `supabase/analytics-schema.sql` ก่อนใช้งาน (
            {setupError})
          </p>
        ) : null}

        {summary ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-medium text-brand-muted">{stat.label}</p>
                  <p className="mt-2 text-4xl font-bold text-brand-dark">
                    {formatNumber(stat.value)}
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">{stat.hint}</p>
                </article>
              ))}
            </div>

            <section className="rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-dark">การเข้าชมแต่ละหน้า</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F7F8FC] text-brand-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">หน้า</th>
                      <th className="px-4 py-3 font-medium">จำนวนเข้าชม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.pageViews.map((item) => (
                      <tr key={item.pageKey} className="border-t border-[#EEF1F6]">
                        <td className="px-4 py-3 text-brand-dark">{item.label}</td>
                        <td className="px-4 py-3 font-medium text-brand-dark">
                          {formatNumber(item.viewCount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <TopList
                title="ข่าวยอดนิยม"
                items={summary.topNews}
                hrefPrefix="/news"
                emptyText="ยังไม่มีสถิติข่าว"
              />
              <TopList
                title="ทุนยอดนิยม"
                items={summary.topFundings}
                hrefPrefix="/funding"
                emptyText="ยังไม่มีสถิติทุน"
              />
              <TopList
                title="นักวิจัยยอดนิยม"
                items={summary.topResearchers}
                hrefPrefix="/researchers"
                emptyText="ยังไม่มีสถิตินักวิจัย"
              />
            </div>

            <p className="text-sm text-brand-muted">
              หมายเหตุ: นับทุกครั้งที่เปิดหน้า (page view) ไม่ใช่ unique visitor
            </p>
          </>
        ) : null}
      </div>
    </>
  );
}
