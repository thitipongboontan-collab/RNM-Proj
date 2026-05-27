"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ResearcherPublication } from "@/data/researchers";

export type ProfileTabId = "expertise" | "publications" | "collaborations";

type ResearcherProfileTabsProps = {
  researcherId: string;
  initialTab?: ProfileTabId;
  expertise?: string[];
  publications?: ResearcherPublication[];
  collaborations?: string[];
};

const TAB_LABELS: Record<ProfileTabId, string> = {
  expertise: "ความเชี่ยวชาญและความสนใจ",
  publications: "ผลงาน",
  collaborations: "เครือข่ายความร่วมมือ",
};

function formatPublicationLine(publication: ResearcherPublication) {
  const meta = [publication.sourceTitle, publication.year ? String(publication.year) : undefined]
    .filter(Boolean)
    .join(", ");

  return meta ? `${publication.title}, ${meta}` : publication.title;
}

function TabPanel({
  lines,
  scrollable = false,
}: {
  lines: string[];
  scrollable?: boolean;
}) {
  if (!lines.length) {
    return (
      <div className="flex min-h-[100px] items-center justify-center rounded-b-[16px] bg-[#FAFBFD] px-4 py-6 text-center text-sm text-[#778097] sm:min-h-[120px]">
        ไม่มีข้อมูลในส่วนนี้
      </div>
    );
  }

  return (
    <div
      className={`rounded-b-[16px] bg-[#FAFBFD] ${scrollable ? "max-h-[220px] overflow-y-auto sm:max-h-[272px]" : ""}`}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`}>
          <p className="px-3 py-2.5 text-sm font-normal leading-[22px] text-brand-dark sm:px-4 sm:py-3 sm:text-base">
            {line}
          </p>
          {index < lines.length - 1 && <div className="mx-3 border-t border-[#E5E7EB] sm:mx-4" />}
        </div>
      ))}
    </div>
  );
}

export function ResearcherProfileTabs({
  researcherId,
  initialTab = "expertise",
  expertise = [],
  publications = [],
  collaborations = [],
}: ResearcherProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function handleTabChange(tabId: ProfileTabId) {
    if (tabId === activeTab) return;

    setActiveTab(tabId);

    const nextUrl =
      tabId === "expertise"
        ? `/researchers/${researcherId}`
        : `/researchers/${researcherId}?tab=${tabId}`;

    router.replace(nextUrl, { scroll: false });
  }

  const tabContent = useMemo(
    () => ({
      expertise,
      publications: publications.map(formatPublicationLine),
      collaborations,
    }),
    [collaborations, expertise, publications],
  );

  const isScrollable =
    activeTab === "publications" || activeTab === "collaborations";

  return (
    <section className="w-full overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-[#EEF1F7]">
      <div
        className="scrollbar-hide flex flex-col gap-1 p-1 sm:flex-row"
        role="tablist"
        aria-label="ข้อมูลนักวิจัย"
      >
        {(Object.keys(TAB_LABELS) as ProfileTabId[]).map((tabId) => {
          const isActive = activeTab === tabId;

          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tabId)}
              className={`min-h-[40px] w-full rounded-[12px] px-3 py-2 text-center text-xs font-semibold leading-[18px] transition sm:flex-1 sm:px-2 sm:text-[13px] ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "bg-transparent text-brand-primary hover:bg-white/60"
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <TabPanel lines={tabContent[activeTab]} scrollable={isScrollable} />
      </div>
    </section>
  );
}
