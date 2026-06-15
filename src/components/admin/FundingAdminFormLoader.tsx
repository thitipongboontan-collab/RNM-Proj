"use client";

import dynamic from "next/dynamic";

const FundingAdminForm = dynamic(() => import("@/components/admin/FundingAdminForm"), {
  loading: () => (
    <div className="rounded-xl border border-[#E5E7EF] bg-[#FAFBFD] px-4 py-8 text-center text-sm text-brand-muted">
      กำลังโหลดฟอร์ม...
    </div>
  ),
});

type FundingAdminFormLoaderProps = {
  mode: "create" | "edit";
  record?: import("@/lib/admin/funding-types").AdminFundingRecord;
  defaults?: {
    fundingCode: string;
    displayOrder: number;
  };
};

export function FundingAdminFormLoader(props: FundingAdminFormLoaderProps) {
  return <FundingAdminForm {...props} />;
}
