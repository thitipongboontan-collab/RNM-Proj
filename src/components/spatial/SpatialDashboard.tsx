"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type {
  SpatialAggregate,
  SpatialDashboardData,
  SpatialOrganization,
} from "@/lib/spatial-repository";

const SpatialMap = dynamic(
  () =>
    import("@/components/spatial/SpatialMap").then((mod) => ({
      default: mod.SpatialMap,
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

type SpatialDashboardProps = {
  data: SpatialDashboardData;
};

function searchText(organization: SpatialOrganization) {
  return [
    organization.name,
    organization.country,
    organization.province,
    organization.region,
    ...organization.researchers.flatMap((researcher) => [
      researcher.name,
      researcher.nameEn ?? "",
      researcher.department,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function buildAggregate(
  keyPrefix: "province" | "region" | "country",
  label: string,
  organizations: SpatialOrganization[],
): SpatialAggregate {
  const count = organizations.reduce((sum, item) => sum + item.collaborationCount, 0);
  const totalWeight = Math.max(count, organizations.length, 1);
  const latitude =
    organizations.reduce(
      (sum, item) => sum + item.latitude * Math.max(item.collaborationCount, 1),
      0,
    ) / totalWeight;
  const longitude =
    organizations.reduce(
      (sum, item) => sum + item.longitude * Math.max(item.collaborationCount, 1),
      0,
    ) / totalWeight;
  const researchers = new Set<string>();
  for (const organization of organizations) {
    for (const researcher of organization.researchers) researchers.add(researcher.name);
  }

  return {
    key: `${keyPrefix}:${label}`,
    label,
    count,
    latitude,
    longitude,
    organizations: organizations.map((item) => item.name),
    researchers: [...researchers],
  };
}

function groupAggregates(
  organizations: SpatialOrganization[],
  keyPrefix: "province" | "region" | "country",
  getLabel: (organization: SpatialOrganization) => string,
) {
  const grouped = new Map<string, SpatialOrganization[]>();
  for (const organization of organizations) {
    const label = getLabel(organization);
    grouped.set(label, [...(grouped.get(label) ?? []), organization]);
  }

  return [...grouped.entries()]
    .map(([label, items]) => buildAggregate(keyPrefix, label, items))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/45 bg-white/70 p-5 text-center shadow-[0px_10px_32px_rgba(37,50,75,0.08)] backdrop-blur-md">
      <p className="text-base font-semibold text-[#8A94A8]">{label}</p>
      <p className="mt-2 text-5xl font-black leading-none text-black">{value}</p>
      <p className="mt-1 text-base font-medium text-[#8A94A8]">หน่วยงาน</p>
    </div>
  );
}

export function SpatialDashboard({ data }: SpatialDashboardProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [researcherId, setResearcherId] = useState("all");
  const [selectedOrganization, setSelectedOrganization] = useState<string | undefined>();
  const hasActiveFilters =
    query.trim() !== "" ||
    country !== "all" ||
    researcherId !== "all";

  function resetFilters() {
    setQuery("");
    setCountry("all");
    setResearcherId("all");
    setSelectedOrganization(undefined);
  }

  const researcherOptions = useMemo(() => {
    const collaborationCounts = new Map<string, number>();
    for (const organization of data.organizations) {
      if (organization.locationLevel === "unknown") continue;
      for (const researcher of organization.researchers) {
        collaborationCounts.set(
          researcher.id,
          (collaborationCounts.get(researcher.id) ?? 0) + 1,
        );
      }
    }

    return [...data.researchers].sort((a, b) => {
      const countDiff =
        (collaborationCounts.get(b.id) ?? 0) - (collaborationCounts.get(a.id) ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.id.localeCompare(b.id);
    });
  }, [data.organizations, data.researchers]);

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.organizations.filter((organization) => {
      if (organization.locationLevel === "unknown") return false;
      if (country !== "all" && organization.country !== country) return false;
      if (
        researcherId !== "all" &&
        !organization.researchers.some((researcher) => researcher.id === researcherId)
      ) {
        return false;
      }
      if (normalizedQuery && !searchText(organization).includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [country, data.organizations, query, researcherId]);

  useEffect(() => {
    if (
      selectedOrganization &&
      !filteredOrganizations.some((organization) => organization.name === selectedOrganization)
    ) {
      setSelectedOrganization(undefined);
    }
  }, [filteredOrganizations, selectedOrganization]);

  const provinceAggregates = useMemo(
    () =>
      groupAggregates(
        filteredOrganizations,
        "province",
        (item) => (item.country === "Thailand" ? item.province : item.country),
      ),
    [filteredOrganizations],
  );
  const regionAggregates = useMemo(
    () => groupAggregates(filteredOrganizations, "region", (item) => item.region),
    [filteredOrganizations],
  );
  const countryAggregates = useMemo(
    () => groupAggregates(filteredOrganizations, "country", (item) => item.country),
    [filteredOrganizations],
  );

  const selected = filteredOrganizations.find((item) => item.name === selectedOrganization);
  const domesticCount = filteredOrganizations
    .filter((item) => item.country === "Thailand")
    .length;
  const internationalCount = filteredOrganizations
    .filter((item) => item.country !== "Thailand")
    .length;

  return (
    <div className="mx-auto w-full max-w-none">
      <div className="overflow-hidden rounded-[18px] border border-[#DDE7EC] bg-white shadow-[0px_14px_45px_rgba(37,50,75,0.08)]">
        <div className="grid gap-2 border-b border-[#DDE7EC] bg-white/95 p-2.5 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <select
            value={researcherId}
            onChange={(event) => setResearcherId(event.target.value)}
            suppressHydrationWarning
            className="h-11 min-w-0 rounded-lg border border-[#B9C1C9] bg-white px-3 text-center text-sm font-medium text-brand-dark outline-none focus:border-brand-primary"
          >
            <option value="all">นักวิจัย</option>
            {researcherOptions.map((researcher) => (
              <option key={researcher.id} value={researcher.id}>
                {researcher.name}
              </option>
            ))}
          </select>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            suppressHydrationWarning
            className="h-11 min-w-0 rounded-lg border border-[#B9C1C9] bg-white px-3 text-center text-sm font-medium text-brand-dark outline-none focus:border-brand-primary"
          >
            <option value="all">ประเทศ</option>
            {data.countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="relative block">
            <span className="sr-only">ค้นหา</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหา"
              suppressHydrationWarning
              className="h-11 w-full min-w-0 rounded-lg border border-[#B9C1C9] bg-white px-10 text-center text-sm font-medium text-brand-dark outline-none transition placeholder:text-brand-dark focus:border-brand-primary"
            />
            <span className="pointer-events-none absolute left-[calc(50%-2.5rem)] top-1/2 -translate-y-1/2 text-xl text-[#9F9F9F]">
              ⌕
            </span>
          </label>
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
            <SpatialMap
              organizations={filteredOrganizations}
              provinceAggregates={provinceAggregates}
              regionAggregates={regionAggregates}
              countryAggregates={countryAggregates}
              selectedOrganization={selected?.name}
              focusedOrganizationName={selected?.name}
              focusedCountry={country !== "all" && !selected ? country : undefined}
              onSelectOrganization={setSelectedOrganization}
              onSelectAggregate={(aggregate) => {
                if (data.countries.includes(aggregate.label)) {
                  setCountry(aggregate.label);
                  setSelectedOrganization(undefined);
                }
              }}
              onClearAggregate={resetFilters}
            />
          </div>

          <div className="pointer-events-none absolute right-4 top-6 z-[500] flex w-[min(380px,calc(100%-2rem))] flex-col gap-5 sm:right-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="ในประเทศ" value={domesticCount} />
              <StatCard label="ต่างประเทศ" value={internationalCount} />
            </div>

            <aside className="pointer-events-auto flex max-h-[360px] flex-col rounded-[18px] border border-white/70 bg-white/85 p-5 text-brand-dark shadow-[0px_16px_42px_rgba(37,50,75,0.14)] backdrop-blur-md sm:max-h-[420px]">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <h2 className="text-xl font-bold">รายชื่อหน่วยงาน</h2>
                  <p className="mt-1 text-xs text-[#00A6B0]">
                    ในประเทศ
                    <span className="mx-2 text-[#778097]">/</span>
                    <span className="text-[#E25B76]">ต่างประเทศ</span>
                  </p>
                </div>
                <p className="text-sm text-[#778097]">
                  {filteredOrganizations.length} หน่วยงาน
                </p>
              </div>

              {selected && (
                <div className="mt-4 rounded-2xl border border-[#DDE7EC] bg-white/80 p-4">
                  <p className="text-base font-semibold">{selected.name}</p>
                  <p className="mt-1 text-sm text-[#778097]">
                    {selected.province}, {selected.country}
                  </p>
                  <p className="mt-2 text-sm text-brand-primary">
                    {selected.collaborationCount} ความร่วมมือกับ{" "}
                    {selected.researchers.length} นักวิจัย
                  </p>
                </div>
              )}

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                <ol className="flex flex-col gap-2">
                {filteredOrganizations.slice(0, 80).map((organization) => (
                  <li key={organization.name}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrganization(organization.name)}
                      className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl px-3 py-2 text-left transition ${
                        selected?.name === organization.name
                          ? "bg-brand-primary text-white"
                          : "bg-white/70 text-brand-dark hover:bg-white"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {organization.name}
                        </span>
                        <span
                          className={`mt-0.5 block text-xs ${
                            selected?.name === organization.name ? "text-white/75" : "text-[#778097]"
                          }`}
                        >
                          {organization.country}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 whitespace-nowrap text-xs font-semibold ${
                          organization.country === "Thailand" ? "text-[#00A6B0]" : "text-[#E25B76]"
                        }`}
                      >
                        {organization.country === "Thailand" ? "ในประเทศ" : "ต่างประเทศ"}
                      </span>
                    </button>
                  </li>
                ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#778097]">
        <span className="font-semibold text-brand-dark">หมายเหตุ:</span>{" "}
        จำนวนตัวเลขที่แสดงบนแผนที่(marker) คือ
        แสดงจำนวนนักวิจัยที่มีความร่วมมือกับสถาบันหรือหน่วยงานนั้นๆ
      </p>
    </div>
  );
}
