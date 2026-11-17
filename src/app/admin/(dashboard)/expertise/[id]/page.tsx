import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ExpertiseReviewForm } from "@/components/admin/ExpertiseReviewForm";
import { getAdminSession } from "@/lib/admin/auth";
import { sourceLabel } from "@/lib/expertise/present";
import { getExpertiseAdminDetail } from "@/lib/expertise/repository";
import type { ExpertiseProfile } from "@/lib/expertise/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

function isProfile(value: unknown): value is ExpertiseProfile {
  return Boolean(value && typeof value === "object" && "expertise_profile" in value);
}

export default async function AdminExpertiseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAdminSession();
  const detail = await getExpertiseAdminDetail(id);
  if (!detail.source) notFound();

  const display = isProfile(detail.row?.display_profile) ? detail.row?.display_profile : null;
  const aiProfile = isProfile(detail.row?.ai_profile) ? detail.row?.ai_profile : null;
  const shown = display ?? aiProfile;

  return (
    <>
      <AdminHeader
        email={user?.email}
        title={`ความเชี่ยวชาญ ${id}`}
        description="การบันทึกจากผู้ดูแลจะล็อกฉบับที่แสดง การวิเคราะห์รอบถัดไปถูกเก็บแยกและตั้งสถานะ Needs Review"
      />
      <div className="grid flex-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:px-8">
        <section className="rounded-2xl border border-[#E5E7EF] bg-white p-5">
          <p className="text-sm text-brand-muted">
            <Link href="/admin/expertise" className="text-brand-primary hover:underline">
              กลับไปรายการ
            </Link>
          </p>
          <h2 className="mt-3 text-lg font-bold text-brand-dark">หลักฐานที่ระบบใช้</h2>
          <p className="mt-2 text-sm text-brand-muted">{detail.source.department}</p>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <p className="font-semibold text-brand-dark">ความเชี่ยวชาญที่บันทึกไว้เดิม</p>
              <ul className="mt-1 list-disc pl-5 text-brand-dark/80">
                {detail.source.manualExpertise.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-brand-dark">ผลงาน</p>
              <ul className="mt-1 max-h-64 list-disc overflow-y-auto pl-5 text-brand-dark/80">
                {detail.source.publications.map((item) => (
                  <li key={item.id}>
                    {item.title}
                    {item.year ? ` (${item.year})` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-brand-dark">โครงการ</p>
              <ul className="mt-1 list-disc pl-5 text-brand-dark/80">
                {detail.source.projects.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            </div>
          </div>
          {shown ? (
            <div className="mt-6 border-t border-[#E5E7EF] pt-4">
              <h3 className="font-semibold text-brand-dark">เหตุผลและหลักฐานของฉบับที่แสดง</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {[...shown.expertise_profile.primary_expertise, ...shown.expertise_profile.secondary_expertise].map(
                  (topic) => (
                    <li key={topic.topic} className="rounded-xl bg-[#F7F8FC] p-3 text-sm">
                      <p className="font-semibold text-brand-dark">{topic.topic}</p>
                      <p className="mt-1 text-brand-dark/80">{topic.rationale}</p>
                      <ul className="mt-2 text-xs text-[#4C5870]">
                        {topic.evidence.map((item) => (
                          <li key={item.id}>
                            {sourceLabel(item.source)}: {item.label}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-sm text-brand-muted">ยังไม่มีการวิเคราะห์</p>
          )}
          {detail.row?.analysis_status === "needs_review" && aiProfile ? (
            <div className="mt-6 rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-4 text-sm">
              <p className="font-semibold text-[#B45309]">ผลการวิเคราะห์ใหม่ที่ยังไม่แทนที่ฉบับตรวจทาน</p>
              <ul className="mt-2 list-disc pl-5 text-[#92400E]">
                {aiProfile.expertise_profile.primary_expertise.map((topic) => (
                  <li key={topic.topic}>Primary: {topic.topic}</li>
                ))}
                {aiProfile.expertise_profile.secondary_expertise.map((topic) => (
                  <li key={topic.topic}>Secondary: {topic.topic}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
        <section className="rounded-2xl border border-[#E5E7EF] bg-white p-5">
          <ExpertiseReviewForm
            researcherId={id}
            status={detail.row?.analysis_status ?? "pending"}
            note={detail.row?.review_note ?? ""}
            profile={shown}
          />
          <p className="mt-4 text-xs leading-5 text-brand-muted">
            ค่า confidence ไม่ใช่ความน่าจะเป็นที่ปรับเทียบแล้ว เป็นคะแนนอิ่มตัวจากน้ำหนักหลักฐาน
            evidence_weighted_v1: ผลงาน 3, โครงการ 2.5, ความเชี่ยวชาญที่บันทึก 2, คำสำคัญ 1, การศึกษา 0.5
          </p>
        </section>
      </div>
    </>
  );
}
