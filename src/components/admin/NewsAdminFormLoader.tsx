"use client";

import dynamic from "next/dynamic";
import type { AdminNewsRecord } from "@/lib/admin/news-types";

const NewsAdminForm = dynamic(() => import("@/components/admin/NewsAdminForm"), {
  loading: () => (
    <div className="rounded-xl border border-[#E5E7EF] bg-[#FAFBFD] px-4 py-8 text-center text-sm text-brand-muted">
      กำลังโหลดฟอร์ม...
    </div>
  ),
});

type NewsAdminFormLoaderProps = {
  mode: "create" | "edit";
  record?: AdminNewsRecord;
};

export function NewsAdminFormLoader(props: NewsAdminFormLoaderProps) {
  return <NewsAdminForm {...props} />;
}
