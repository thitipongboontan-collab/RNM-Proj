import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import type { FundingListItem } from "@/data/funding";
import { FundingCard } from "./FundingCard";

export function FundingPage({ items }: { items: FundingListItem[] }) {
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แหล่งทุน" },
        ]}
      />
      <main className="flex flex-col items-center gap-8 px-4 pb-12 pt-6 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-8 md:px-10 lg:gap-[50px] lg:px-[60px] lg:pb-20 lg:pt-10">
        <PageTitle>แหล่งทุน</PageTitle>
        <div className="grid w-full max-w-[1320px] grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-[30px]">
          {items.map((item) => (
            <FundingCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </>
  );
}
