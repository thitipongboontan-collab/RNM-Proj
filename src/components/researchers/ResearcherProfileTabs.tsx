"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ResearcherProject, ResearcherPublication } from "@/data/researchers";

export type ProfileTabId = "expertise" | "projects" | "publications" | "collaborations";

type ResearcherProfileTabsProps = {
  researcherId: string;
  initialTab?: ProfileTabId;
  expertise?: string[];
  projects?: ResearcherProject[];
  publications?: ResearcherPublication[];
  collaborations?: string[];
};

const TAB_ORDER: ProfileTabId[] = ["expertise", "projects", "publications", "collaborations"];

const TAB_LABELS: Record<ProfileTabId, string> = {
  expertise: "ความเชี่ยวชาญและความสนใจ",
  projects: "โครงการวิจัย",
  publications: "ผลงานตีพิมพ์",
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

function ProjectsTabPanel({ projects }: { projects: ResearcherProject[] }) {
  if (!projects.length) {
    return (
      <div className="flex min-h-[100px] items-center justify-center rounded-b-[16px] bg-[#FAFBFD] px-4 py-6 text-center text-sm text-[#778097] sm:min-h-[120px]">
        ไม่มีข้อมูลในส่วนนี้
      </div>
    );
  }

  return (
    <div className="max-h-[272px] overflow-y-auto rounded-b-[16px] bg-[#FAFBFD]">
      {projects.map((project, index) => (
        <div key={project.id}>
          <div className="flex flex-col gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
            <p className="text-sm font-medium leading-snug text-brand-dark sm:text-base">
              {project.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  project.roleLabel === "หัวหน้าโครงการ"
                    ? "bg-[#E8F4FD] text-[#1565C0]"
                    : "bg-[#EEF7F0] text-[#2E7D32]"
                }`}
              >
                {project.roleLabel}
              </span>
              {project.fiscalYearBe ? (
                <span className="text-xs text-[#778097]">ปีงบประมาณ {project.fiscalYearBe}</span>
              ) : null}
            </div>
          </div>
          {index < projects.length - 1 && <div className="mx-3 border-t border-[#E5E7EB] sm:mx-4" />}
        </div>
      ))}
    </div>
  );
}

export function ResearcherProfileTabs({
  researcherId,
  initialTab = "expertise",
  expertise = [],
  projects = [],
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

  const publicationLines = useMemo(
    () => publications.map(formatPublicationLine),
    [publications],
  );

  const isScrollable =
    activeTab === "projects" ||
    activeTab === "publications" ||
    activeTab === "collaborations";

  return (
    <section className="w-full overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-[#EEF1F7]">
      <div
        className="scrollbar-hide flex flex-col gap-1 p-1 sm:flex-row sm:flex-wrap"
        role="tablist"
        aria-label="ข้อมูลนักวิจัย"
      >
        {TAB_ORDER.map((tabId) => {
          const isActive = activeTab === tabId;

          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tabId)}
              className={`min-h-[40px] w-full rounded-[12px] px-3 py-2 text-center text-xs font-semibold leading-[18px] transition sm:min-w-0 sm:flex-1 sm:px-2 sm:text-[13px] ${
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
        {activeTab === "projects" ? (
          <ProjectsTabPanel projects={projects} />
        ) : (
          <TabPanel
            lines={
              activeTab === "expertise"
                ? expertise
                : activeTab === "publications"
                  ? publicationLines
                  : collaborations
            }
            scrollable={isScrollable}
          />
        )}
      </div>
    </section>
  );
}
