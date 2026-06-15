"use client";

import { useTransition } from "react";
import { deleteFundingAction } from "@/app/admin/fundings/actions";

export function FundingDeleteButton({ fundingId, title }: { fundingId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`ลบแหล่งทุน "${title}" ใช่หรือไม่?`)) return;
        startTransition(async () => {
          await deleteFundingAction(fundingId);
        });
      }}
      className="rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C] transition hover:bg-[#FFF1F2] disabled:opacity-60"
    >
      {pending ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
