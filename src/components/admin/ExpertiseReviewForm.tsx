import { EXPERTISE_STATUSES } from "@/lib/expertise/types";
import type { ExpertiseProfile } from "@/lib/expertise/types";
import {
  analyzeExpertiseAction,
  saveExpertiseReviewAction,
} from "@/app/admin/expertise/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ai_analyzed: "AI Analyzed",
  needs_review: "Needs Review",
  approved: "Approved",
  rejected: "Rejected",
  insufficient_evidence: "Insufficient Evidence",
};

function lines(values: string[]): string {
  return values.join("\n");
}

export function ExpertiseReviewForm({
  researcherId,
  status,
  note,
  profile,
}: {
  researcherId: string;
  status: string;
  note: string;
  profile: ExpertiseProfile | null;
}) {
  const topics = profile?.expertise_profile;

  return (
    <div className="flex flex-col gap-6">
      <form action={analyzeExpertiseAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="researcherId" value={researcherId} />
        <input type="hidden" name="force" value="1" />
        <button
          type="submit"
          className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          วิเคราะห์ใหม่
        </button>
      </form>

      <form action={saveExpertiseReviewAction} className="flex flex-col gap-4">
        <input type="hidden" name="researcherId" value={researcherId} />
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          สถานะ
          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-xl border border-[#D9DEE8] bg-white px-3"
          >
            {EXPERTISE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Primary expertise (หนึ่งหัวข้อต่อบรรทัด)
          <textarea
            name="primary"
            defaultValue={lines(topics?.primary_expertise.map((item) => item.topic) ?? [])}
            rows={4}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Secondary expertise
          <textarea
            name="secondary"
            defaultValue={lines(topics?.secondary_expertise.map((item) => item.topic) ?? [])}
            rows={4}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Research methods
          <textarea
            name="methods"
            defaultValue={lines(topics?.research_methods ?? [])}
            rows={3}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Geographical focus
          <textarea
            name="geography"
            defaultValue={lines(topics?.geographical_focus ?? [])}
            rows={3}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Target populations
          <textarea
            name="populations"
            defaultValue={lines(topics?.target_populations ?? [])}
            rows={3}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          Research domains
          <textarea
            name="domains"
            defaultValue={lines(topics?.research_domains ?? [])}
            rows={3}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-brand-dark">
          บันทึกผู้ตรวจทาน
          <textarea
            name="note"
            defaultValue={note}
            rows={3}
            className="rounded-xl border border-[#D9DEE8] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded-xl border border-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary"
        >
          บันทึกการตรวจทาน
        </button>
      </form>
    </div>
  );
}
