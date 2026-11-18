"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractFundingAttachmentsAction } from "@/app/admin/fundings/actions";

export function ExtractFundingAttachmentsButton({ fundingId }: { fundingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className="rounded-xl border border-[#D9DEE8] bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA] disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setMessage(null);
          setError(null);
          const result = await extractFundingAttachmentsAction(fundingId);
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage(result.success ?? "วิเคราะห์ไฟล์แนบแล้ว");
          router.refresh();
        }}
      >
        {pending ? "กำลังวิเคราะห์ไฟล์..." : "วิเคราะห์ไฟล์แนบเพื่อใช้จับคู่ AI"}
      </button>
      {message ? <p className="text-xs text-[#047857]">{message}</p> : null}
      {error ? <p className="text-xs text-[#BE123C]">{error}</p> : null}
    </div>
  );
}
