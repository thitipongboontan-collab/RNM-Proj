import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResearcherAdminFormLoader } from "@/components/admin/ResearcherAdminFormLoader";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminResearcherById } from "@/lib/admin/researcher-admin";
import { resolveResearcherImageSrc } from "@/lib/researcher-assets";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminResearcherEditPage({ params, searchParams }: PageProps) {
  const user = await getAdminSession();
  const { id } = await params;
  const { saved } = await searchParams;

  let record: Awaited<ReturnType<typeof getAdminResearcherById>> = null;

  try {
    record = await getAdminResearcherById(id);
  } catch {
    notFound();
  }

  if (!record) {
    notFound();
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title="แก้ไขนักวิจัย"
        description={`${record.nameTh} (${record.researcherId})`}
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <Link
          href="/admin/researchers"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          ← กลับไปรายการนักวิจัย
        </Link>

        {saved === "1" ? (
          <p className="max-w-4xl rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            เพิ่มนักวิจัยเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <ResearcherAdminFormLoader
            mode="edit"
            record={record}
            previewImageSrc={resolveResearcherImageSrc(record.researcherId, record.imagePath)}
          />
        </div>
      </div>
    </>
  );
}
