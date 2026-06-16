"use client";

import dynamic from "next/dynamic";
import type { AdminResearcherRecord } from "@/lib/admin/researcher-types";

const ResearcherAdminForm = dynamic(() => import("@/components/admin/ResearcherAdminForm"), {
  loading: () => (
    <div className="rounded-xl border border-[#E5E7EF] bg-[#FAFBFD] px-4 py-8 text-center text-sm text-brand-muted">
      กำลังโหลดฟอร์ม...
    </div>
  ),
});

type ResearcherAdminFormLoaderProps = {
  mode: "create" | "edit";
  record?: AdminResearcherRecord;
  previewImageSrc?: string;
};

export function ResearcherAdminFormLoader(props: ResearcherAdminFormLoaderProps) {
  return <ResearcherAdminForm {...props} />;
}
