import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import { FUNDING_ITEMS } from "@/data/funding";
import { FundingCard } from "./FundingCard";

export function FundingPage() {
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
        <div className="flex w-[1320px] flex-col gap-10">
          <div className="flex flex-col gap-10">
            <div className="flex justify-center gap-10">
              {FUNDING_ITEMS.slice(0, 3).map((item) => (
                <FundingCard key={item.id} item={item} />
              ))}
            </div>
            <div className="flex justify-center gap-10">
              {FUNDING_ITEMS.slice(3, 6).map((item) => (
                <FundingCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
