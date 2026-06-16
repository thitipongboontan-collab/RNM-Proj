"use client";

import { useTransition } from "react";
import { deleteResearcherAction } from "@/app/admin/researchers/actions";

export function ResearcherDeleteButton({
  researcherId,
  name,
}: {
  researcherId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`ลบนักวิจัย "${name}" ใช่หรือไม่?`)) return;
        startTransition(async () => {
          await deleteResearcherAction(researcherId);
        });
      }}
      className="rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C] transition hover:bg-[#FFF1F2] disabled:opacity-60"
    >
      {pending ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
