import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import type { FundingItem } from "@/data/funding";
import { FundingCard } from "./FundingCard";

export function FundingPage({ items }: { items: FundingItem[] }) {
  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แหล่งทุน" },
        ]}
      />
      <main className="flex flex-col items-center gap-[50px] px-[60px] pb-20 pt-10">
        <PageTitle>แหล่งทุน</PageTitle>
        <div className="grid w-[1320px] max-w-full grid-cols-3 gap-x-[30px] gap-y-10">
          {items.map((item) => (
            <FundingCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
