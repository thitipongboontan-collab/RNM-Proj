"use client";

import { useTransition } from "react";
import { deleteNewsAction } from "@/app/admin/news/actions";

export function NewsDeleteButton({ newsId, title }: { newsId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`ลบข่าว "${title}" ใช่หรือไม่?`)) return;
        startTransition(async () => {
          await deleteNewsAction(newsId);
        });
      }}
      className="rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C] transition hover:bg-[#FFF1F2] disabled:opacity-60"
    >
      {pending ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
