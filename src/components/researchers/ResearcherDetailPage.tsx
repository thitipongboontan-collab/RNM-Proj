import Image from "next/image";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RecordContentView } from "@/components/analytics/RecordContentView";
import {
  ContactRow,
  DetailSection,
  MetricsRow,
} from "@/components/researchers/ResearcherDetailParts";
import {
  ResearcherProfileTabs,
  type ProfileTabId,
} from "@/components/researchers/ResearcherProfileTabs";
import type { ResearcherItem } from "@/data/researchers";

export function ResearcherDetailPage({
  item,
  initialTab = "expertise",
}: {
  item: ResearcherItem;
  initialTab?: ProfileTabId;
}) {
  return (
    <>
      <RecordContentView type="researcher" id={item.id} />
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "นักวิจัย", href: "/researchers" },
          { label: item.name },
        ]}
      />

      <main className="px-4 pb-12 pt-6 sm:px-8 sm:pb-16 sm:pt-8 md:px-12 lg:px-[65px] lg:pb-20 lg:pt-[47px]">
        <div className="mx-auto flex w-full max-w-[1311px] flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-5">
          {/* Left column — photo + profile info */}
          <aside className="flex w-full flex-col items-center lg:w-[506px] lg:shrink-0">
            <div
              className="relative aspect-[331/346] w-full max-w-[260px] shrink-0 overflow-hidden bg-gradient-to-br from-[#D2D8EC] to-[#C1DFED] sm:max-w-[300px] lg:max-w-[331px]"
              role="img"
              aria-label={item.name}
            >
              {item.imageSrc && (
                <Image
                  src={item.imageSrc}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 331px"
                  priority
                  className="object-cover"
                />
              )}
            </div>

            <div className="mt-[18px] flex w-full flex-col items-center gap-2 text-center">
              <h1 className="w-full text-2xl font-bold leading-snug text-brand-primary sm:text-[28px] lg:text-[32px]">
                {item.name}
              </h1>
              <p className="w-full text-lg font-medium text-[rgba(37,50,75,0.8)] sm:text-xl lg:text-2xl">
                {item.department}
              </p>
            </div>

            <div className="mt-[15px] w-full">
              <ContactRow email={item.email} phone={item.phone} />
            </div>

            <div className="mt-8 w-full sm:mt-10 lg:mt-[45px]">
              <MetricsRow
                scholarlyOutput={item.scholarlyOutput}
                citations={item.citations}
                hIndex={item.hIndex}
              />
            </div>
          </aside>

          {/* Right column — education / expertise / publications */}
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-1 lg:gap-10">
            {item.education && item.education.length > 0 && (
              <DetailSection
                title="ประวัติการศึกษา"
                items={item.education}
                bulletStyle="disc"
                variant="card"
              />
            )}

            <ResearcherProfileTabs
              researcherId={item.id}
              initialTab={initialTab}
              expertise={item.expertise}
              projects={item.projects}
              publications={item.publications}
              collaborations={item.collaborations}
            />
          </div>
        </div>
      </main>
    </>
  );
}
