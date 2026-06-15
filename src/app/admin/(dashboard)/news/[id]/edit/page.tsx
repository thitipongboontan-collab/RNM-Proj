import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewsAdminFormLoader } from "@/components/admin/NewsAdminFormLoader";
import { NewsDeleteButton } from "@/components/admin/NewsDeleteButton";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminNewsById } from "@/lib/admin/news-admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminNewsEditPage({ params, searchParams }: PageProps) {
  const user = await getAdminSession();
  const { id } = await params;
  const { saved } = await searchParams;
  const record = await getAdminNewsById(id);

  if (!record) {
    notFound();
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title={`แก้ไขข่าว ${record.newsId}`}
        description={record.title}
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/news" className="text-sm font-medium text-brand-primary hover:underline">
            ← กลับไปรายการข่าวสาร
          </Link>
          <NewsDeleteButton newsId={record.newsId} title={record.title} />
        </div>

        {saved === "1" ? (
          <p className="max-w-4xl rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            เพิ่มข่าวเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <NewsAdminFormLoader mode="edit" record={record} />
        </div>
      </div>
    </>
  );
}
