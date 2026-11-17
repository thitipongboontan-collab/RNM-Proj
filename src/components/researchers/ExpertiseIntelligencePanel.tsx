import { sourceLabel, type ExpertiseProfileView, type ExpertiseTopicView } from "@/lib/expertise/present";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอวิเคราะห์",
  ai_analyzed: "วิเคราะห์แล้ว รอตรวจทาน",
  needs_review: "มีการวิเคราะห์ใหม่ ใช้ฉบับที่ตรวจทานแล้ว",
  approved: "ตรวจทานแล้ว",
  insufficient_evidence: "หลักฐานยังไม่พอ",
};

function TopicList({ topics }: { topics: ExpertiseTopicView[] }) {
  if (!topics.length) {
    return <p className="text-sm text-[#778097]">ไม่มีรายการที่หลักฐานรองรับ</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {topics.map((topic) => (
        <li key={topic.topic} className="rounded-xl bg-white px-3 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-brand-dark sm:text-base">{topic.topic}</p>
            <p className="text-xs text-[#778097]">
              {topic.strength} · {topic.confidence.toFixed(2)} · {topic.evidenceCount} หลักฐาน
            </p>
          </div>
          <p className="mt-1 text-sm leading-6 text-brand-dark/80">{topic.rationale}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-brand-primary">
              ดูหลักฐาน
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {topic.evidence.map((item) => (
                <li key={item.id} className="text-xs leading-5 text-[#4C5870]">
                  <span className="font-semibold">{sourceLabel(item.source)}:</span> {item.label}
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  );
}

function ChipRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#778097]">{label}</p>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-dark"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-[#778097]">ไม่มีหลักฐานเพียงพอ</p>
      )}
    </div>
  );
}

export function ExpertiseIntelligencePanel({ profile }: { profile: ExpertiseProfileView }) {
  const insufficient = profile.status === "insufficient_evidence";

  return (
    <section className="w-full rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FC] px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-primary sm:text-lg">
            ความเชี่ยวชาญจากหลักฐาน
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#778097]">
            {STATUS_LABELS[profile.status] ?? profile.status}
            {profile.analyzedAt ? ` · วิเคราะห์ ${profile.analyzedAt.slice(0, 10)}` : ""}
            {profile.modelVersion ? ` · ${profile.modelVersion}` : ""}
          </p>
        </div>
        <p className="text-xs text-[#778097]">
          ผลงาน {profile.summary.publications} · โครงการ {profile.summary.projects} · ความสนใจ{" "}
          {profile.summary.interests}
        </p>
      </div>

      {insufficient ? (
        <p className="mt-4 text-sm leading-6 text-brand-dark">
          ข้อมูลที่มีอยู่ยังไม่พอจะระบุความเชี่ยวชาญหลักโดยไม่เดา ระบบจึงไม่สร้างหัวข้อเพิ่มจากคำสำคัญที่ปรากฏเพียงครั้งเดียว
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <h3 className="mb-2 text-sm font-bold text-brand-dark">Primary Expertise</h3>
            <TopicList topics={profile.primary} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-brand-dark">Secondary Expertise</h3>
            <TopicList topics={profile.secondary} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChipRow label="Research Methods" values={profile.methods} />
            <ChipRow label="Geographical Focus" values={profile.geography} />
            <ChipRow label="Target Populations" values={profile.populations} />
            <ChipRow label="Research Domains" values={profile.domains} />
          </div>
        </div>
      )}
    </section>
  );
}
