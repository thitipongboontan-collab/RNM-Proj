"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterDashboardData } from "@/lib/project-map/filters";
import { formatOperatingAreaLabel } from "@/lib/project-map/operating-area";
import type {
  ProjectMapDashboardData,
  ProjectMapDetail,
  ProjectMapFilters,
} from "@/lib/project-map/types";

function formatProjectYears(startYearBe: number | null | undefined, endYearBe: number | null | undefined) {
  return `${startYearBe ?? "—"} / ${endYearBe ?? "—"}`;
}

const ProjectMap = dynamic(
  () =>
    import("@/components/project-map/ProjectMap").then((mod) => ({
      default: mod.ProjectMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[620px] items-center justify-center rounded-[28px] bg-[#EFF7F7] text-brand-muted">
        กำลังโหลดแผนที่...
      </div>
    ),
  },
);

type ProjectMapDashboardProps = {
  data: ProjectMapDashboardData;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/45 bg-white/70 p-3 text-center shadow-[0px_10px_32px_rgba(37,50,75,0.08)] backdrop-blur-md">
      <p className="text-sm font-semibold leading-snug text-[#8A94A8]">{label}</p>
      <p className="mt-1 text-4xl font-black leading-none text-black">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#8A94A8]">โครงการ</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      suppressHydrationWarning
      className="h-11 min-w-0 rounded-lg border border-[#B9C1C9] bg-white px-3 text-center text-sm font-medium text-brand-dark outline-none focus:border-brand-primary"
    >
      <option value="all">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const EMPTY_FILTERS: Required<
  Pick<ProjectMapFilters, "tambon" | "amphoe" | "province" | "principalInvestigator">
> &
  Required<ProjectMapFilters> = {
  tambon: "all",
  amphoe: "all",
  province: "all",
  principalInvestigator: "all",
  fiscalYear: "all",
  sdg: "all",
  researchGroup: "all",
  researchType: "all",
  fundingSource: "all",
  query: "",
};

export function ProjectMapDashboard({ data }: ProjectMapDashboardProps) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [focusedProjectIds, setFocusedProjectIds] = useState<string[] | undefined>();
  const [focusNonce, setFocusNonce] = useState(0);
  const [detail, setDetail] = useState<ProjectMapDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setFocusNonce((value) => value + 1);
    if (focusedProjectIds && !focusedProjectIds.includes(projectId)) {
      setFocusedProjectIds(undefined);
    }
    if (detail?.projectId !== projectId) {
      setDetailLoading(true);
    }
  }

  function selectProjectsFromMap(projectIds: string[]) {
    const uniqueIds = [...new Set(projectIds)];
    setFocusedProjectIds(uniqueIds);
    if (uniqueIds.length === 1) {
      setSelectedProjectId(uniqueIds[0]);
      setFocusNonce((value) => value + 1);
      if (detail?.projectId !== uniqueIds[0]) {
        setDetailLoading(true);
      }
      return;
    }
    setSelectedProjectId(undefined);
    setDetail(null);
  }

  const filtered = useMemo(
    () => filterDashboardData(data, filters),
    [data, filters],
  );

  const hasActiveFilters =
    filters.tambon !== "all" ||
    filters.amphoe !== "all" ||
    filters.province !== "all" ||
    filters.principalInvestigator !== "all" ||
    Boolean(focusedProjectIds?.length);

  function updateFilter<K extends keyof ProjectMapFilters>(key: K, value: string) {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "province") {
        next.amphoe = "all";
        next.tambon = "all";
      }
      if (key === "amphoe") {
        next.tambon = "all";
      }
      return next;
    });
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSelectedProjectId(undefined);
    setFocusedProjectIds(undefined);
    setDetail(null);
  }

  useEffect(() => {
    if (
      selectedProjectId &&
      !filtered.projects.some((project) => project.projectId === selectedProjectId)
    ) {
      setSelectedProjectId(undefined);
      setDetail(null);
    }
  }, [filtered.projects, selectedProjectId]);

  useEffect(() => {
    if (!focusedProjectIds?.length) return;
    const remaining = focusedProjectIds.filter((projectId) =>
      filtered.projects.some((project) => project.projectId === projectId),
    );
    if (remaining.length === focusedProjectIds.length) return;
    setFocusedProjectIds(remaining.length ? remaining : undefined);
  }, [filtered.projects, focusedProjectIds]);

  const listedProjects = useMemo(() => {
    if (!focusedProjectIds?.length) return filtered.projects;
    const focused = new Set(focusedProjectIds);
    return filtered.projects.filter((project) => focused.has(project.projectId));
  }, [filtered.projects, focusedProjectIds]);

  const visibleProjects = useMemo(() => {
    const list = listedProjects.slice(0, 100);
    if (!selectedProjectId) return list;
    if (list.some((project) => project.projectId === selectedProjectId)) return list;
    const selected = listedProjects.find(
      (project) => project.projectId === selectedProjectId,
    );
    return selected ? [selected, ...list.slice(0, 99)] : list;
  }, [listedProjects, selectedProjectId]);

  useEffect(() => {
    const item = selectedItemRef.current;
    const container = listContainerRef.current;
    if (!selectedProjectId || !item || !container) return;

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
      container.scrollTo({
        top: container.scrollTop + itemRect.top - containerRect.top - 8,
        behavior: "smooth",
      });
    }
  }, [detail, detailLoading, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    fetch(`/api/project-map/${encodeURIComponent(selectedProjectId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return (await response.json()) as ProjectMapDetail;
      })
      .then((payload) => {
        if (!cancelled) setDetail(payload);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <div className="overflow-hidden rounded-[18px] border border-[#DDE7EC] bg-white shadow-[0px_14px_45px_rgba(37,50,75,0.08)]">
        <div className="grid gap-2 border-b border-[#DDE7EC] bg-white/95 p-2.5 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <FilterSelect
            value={filters.tambon}
            onChange={(value) => updateFilter("tambon", value)}
            label="ตำบล"
            options={filtered.filterOptions.tambons}
          />
          <FilterSelect
            value={filters.amphoe}
            onChange={(value) => updateFilter("amphoe", value)}
            label="อำเภอ"
            options={filtered.filterOptions.amphoes}
          />
          <FilterSelect
            value={filters.province}
            onChange={(value) => updateFilter("province", value)}
            label="จังหวัด"
            options={filtered.filterOptions.provinces}
          />
          <FilterSelect
            value={filters.principalInvestigator}
            onChange={(value) => updateFilter("principalInvestigator", value)}
            label="นักวิจัย"
            options={filtered.filterOptions.principalInvestigators}
          />
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="h-11 whitespace-nowrap rounded-lg border border-brand-primary bg-white px-3 text-sm font-semibold text-brand-primary transition hover:bg-[#F4F6FC] disabled:cursor-not-allowed disabled:border-[#DDE7EC] disabled:text-[#B0B8C9] disabled:hover:bg-white"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="relative min-h-[620px]">
          <div className="absolute inset-0 z-0">
            <ProjectMap
              features={filtered.features}
              selectedProjectId={selectedProjectId}
              focusedProjectIds={focusedProjectIds}
              focusNonce={focusNonce}
              onSelectProject={(projectId) => {
                if (projectId) selectProject(projectId);
              }}
              onSelectProjects={selectProjectsFromMap}
            />
          </div>

          <div className="pointer-events-none absolute inset-y-4 right-4 z-[500] flex w-[min(380px,calc(100%-2rem))] flex-col gap-3 sm:right-6">
            <div className="grid shrink-0 grid-cols-2 gap-4">
              <StatCard
                label="จำนวนพื้นที่วิจัยในประเทศ"
                value={filtered.stats.domesticProjectCount}
              />
              <StatCard
                label="จำนวนพื้นที่วิจัยต่างประเทศ"
                value={filtered.stats.internationalProjectCount}
              />
            </div>

            <aside className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white/85 p-5 text-brand-dark shadow-[0px_16px_42px_rgba(37,50,75,0.14)] backdrop-blur-md">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <h2 className="text-xl font-bold">รายการโครงการ</h2>
                  <p className="mt-1 text-xs text-[#00A6B0]">
                    ในประเทศ
                    <span className="mx-2 text-[#778097]">/</span>
                    <span className="text-[#E25B76]">ต่างประเทศ</span>
                  </p>
                </div>
                <p className="text-sm text-[#778097]">
                  {listedProjects.length} โครงการ
                </p>
              </div>

              {focusedProjectIds && focusedProjectIds.length > 1 ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#EEF7F8] px-3 py-2 text-xs text-[#00838A]">
                  <span>แสดงเฉพาะโครงการในจุดที่เลือก</span>
                  <button
                    type="button"
                    onClick={() => setFocusedProjectIds(undefined)}
                    className="shrink-0 font-semibold underline-offset-2 hover:underline"
                  >
                    แสดงทั้งหมด
                  </button>
                </div>
              ) : null}

              {selectedProjectId ? (
                <div className="mt-4 max-h-[180px] overflow-y-auto rounded-2xl border border-[#DDE7EC] bg-white/90 p-4">
                  {detailLoading || detail?.projectId !== selectedProjectId ? (
                    <p className="text-sm text-[#778097]">กำลังโหลดรายละเอียด...</p>
                  ) : detail ? (
                    <div className="space-y-1.5 text-sm">
                      <p className="font-semibold leading-snug">{detail.titleTh}</p>
                      {detail.titleEn ? (
                        <p className="line-clamp-2 text-xs leading-snug text-[#778097]">
                          {detail.titleEn}
                        </p>
                      ) : null}
                      <p className="text-xs">
                        <span className="font-semibold">ปีเริ่มโครงการ/สิ้นสุด:</span>{" "}
                        {formatProjectYears(detail.startYearBe, detail.endYearBe)}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">ปีงบประมาณ:</span>{" "}
                        {detail.fiscalYearBe ?? "—"}
                        <span className="mx-2 text-[#C5CDD8]">·</span>
                        <span className="font-semibold">แหล่งทุน:</span>{" "}
                        {detail.fundingSource || "—"}
                      </p>
                      {detail.researchGroup ? (
                        <p className="line-clamp-2 text-xs">
                          <span className="font-semibold">กลุ่มการวิจัย:</span>{" "}
                          {detail.researchGroup}
                        </p>
                      ) : null}
                      <div className="pt-1">
                        <p className="mb-1 text-xs font-semibold">พื้นที่ดำเนินงาน</p>
                        <ul className="space-y-1">
                          {detail.locations.map((location) => (
                            <li
                              key={location.projectLocationId}
                              className="rounded-lg border border-[#E3EAF2] bg-white px-2 py-1.5 text-xs"
                            >
                              <p className="font-semibold text-brand-dark">
                                {[
                                  location.areaName,
                                  location.tambon,
                                  location.amphoe,
                                  location.province,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || location.locationId}
                              </p>
                              <p className="text-[#778097]">{location.positionLabel}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#778097]">ไม่พบรายละเอียด</p>
                  )}
                </div>
              ) : null}

              <div
                ref={listContainerRef}
                className="mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
              >
                {listedProjects.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-[#778097]">
                    {filtered.projects.length === 0
                      ? "ไม่พบโครงการตามเงื่อนไข"
                      : "ไม่พบโครงการในจุดที่เลือก"}
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {visibleProjects.map((project) => {
                      const selected = project.projectId === selectedProjectId;
                      return (
                        <li
                          key={project.projectId}
                          ref={selected ? selectedItemRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={() => selectProject(project.projectId)}
                            className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl px-3 py-2 text-left transition ${
                              selected
                                ? "bg-brand-primary text-white"
                                : "bg-white/70 text-brand-dark hover:bg-white"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="line-clamp-2 block text-sm font-semibold">
                                {project.titleTh}
                              </span>
                              <span className="mt-1.5 flex flex-wrap gap-1">
                                {project.hasDomesticLocation ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      selected
                                        ? "bg-white/20 text-white"
                                        : "bg-[#E8F7F8] text-[#00838A]"
                                    }`}
                                  >
                                    ในประเทศ
                                  </span>
                                ) : null}
                                {project.hasInternationalLocation ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      selected
                                        ? "bg-white/20 text-white"
                                        : "bg-[#FDECEE] text-[#D23B57]"
                                    }`}
                                  >
                                    ต่างประเทศ
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-1.5 block space-y-1">
                                {project.linkedResearchers.map((researcher) => (
                                  <span
                                    key={researcher.researcherId}
                                    className={`block text-xs ${
                                      selected ? "text-white/85" : "text-[#5F6B7C]"
                                    }`}
                                  >
                                    <span className="font-semibold">{researcher.name}</span>
                                    <span
                                      className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                        selected
                                          ? "bg-white/20 text-white"
                                          : researcher.role === "principal"
                                            ? "bg-[#EEF3FF] text-[#3554C3]"
                                            : "bg-[#F4F1EA] text-[#7A6540]"
                                      }`}
                                    >
                                      {researcher.roleLabel}
                                    </span>
                                  </span>
                                ))}
                                {(project.operatingAreas ?? []).map((area, index) => {
                                  const label = formatOperatingAreaLabel(area);
                                  if (!label) return null;
                                  return (
                                    <span
                                      key={`${project.projectId}:area:${index}`}
                                      className={`block text-[11px] leading-snug ${
                                        selected ? "text-white/75" : "text-[#6B7287]"
                                      }`}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                                <span
                                  className={`block text-[11px] leading-snug ${
                                    selected ? "text-white/75" : "text-[#6B7287]"
                                  }`}
                                >
                                  ปีเริ่มโครงการ/สิ้นสุด:{" "}
                                  {formatProjectYears(project.startYearBe, project.endYearBe)}
                                </span>
                              </span>
                              <span
                                className={`mt-1 block text-[11px] ${
                                  selected ? "text-white/70" : "text-[#8A94A8]"
                                }`}
                              >
                                {project.mappableLocationCount > 0
                                  ? `บนแผนที่ ${project.mappableLocationCount} จุด`
                                  : "รอตรวจสอบตำแหน่ง"}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[#778097]">
        จุดที่มีตัวเลขมากกว่า 1 คือโครงการที่ใช้พิกัดอำเภอหรือจังหวัดเดียวกัน
        แสดงเฉพาะพิกัดที่ตรวจสอบแล้ว ไม่มีการสร้างพิกัดโดยประมาณ
      </p>
    </div>
  );
}
