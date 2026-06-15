import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FundingAdminFormLoader } from "@/components/admin/FundingAdminFormLoader";
import { FundingDeleteButton } from "@/components/admin/FundingDeleteButton";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminFundingById } from "@/lib/admin/funding-admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminFundingEditPage({ params, searchParams }: PageProps) {
  const user = await getAdminSession();
  const { id } = await params;
  const { saved } = await searchParams;
  const record = await getAdminFundingById(id);

  if (!record) {
    notFound();
  }

  return (
    <>
      <AdminHeader
        email={user?.email}
        title={`แก้ไขแหล่งทุน ${record.fundingId}`}
        description={record.title}
      />

      <div className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/fundings" className="text-sm font-medium text-brand-primary hover:underline">
            ← กลับไปรายการแหล่งทุน
          </Link>
          <FundingDeleteButton fundingId={record.fundingId} title={record.title} />
        </div>

        {saved === "1" ? (
          <p className="max-w-4xl rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
            เพิ่มแหล่งทุนเรียบร้อยแล้ว
          </p>
        ) : null}

        <div className="max-w-4xl rounded-2xl border border-[#E5E7EF] bg-white p-6 shadow-sm">
          <FundingAdminFormLoader mode="edit" record={record} />
        </div>
      </div>
    </>
  );
}
