import { unstable_cache } from "next/cache";
import { buildResearcherIntelligence } from "@/lib/ai/intelligence/researcher-profile";
import {
  buildPublicationTrendByYear,
  buildTopTopics,
} from "@/lib/ai/intelligence/publication-trends";
import type { IntelligenceIndex, ResearcherIntelligence } from "@/lib/ai/intelligence/types";
import { getAssistantDataset, type AssistantDataset } from "@/lib/assistant-dataset";

function buildIntelligenceIndex(dataset: AssistantDataset): IntelligenceIndex {
  const departmentGroups = new Map<string, typeof dataset.researchers>();

  for (const record of dataset.researchers) {
    const list = departmentGroups.get(record.row.department) ?? [];
    list.push(record);
    departmentGroups.set(record.row.department, list);
  }

  const rankByDepartment = new Map<string, Map<string, number>>();

  for (const [department, records] of departmentGroups) {
    const sorted = [...records].sort(
      (a, b) => (b.row.scholarly_output ?? 0) - (a.row.scholarly_output ?? 0),
    );
    const rankMap = new Map<string, number>();
    sorted.forEach((record, index) => {
      rankMap.set(record.row.researcher_id, index + 1);
    });
    rankByDepartment.set(department, rankMap);
  }

  const researchers = new Map<string, ResearcherIntelligence>();

  for (const record of dataset.researchers) {
    const rankMap = rankByDepartment.get(record.row.department);
    const departmentTotal = departmentGroups.get(record.row.department)?.length ?? 0;
    const departmentRank = rankMap?.get(record.row.researcher_id) ?? departmentTotal;

    researchers.set(
      record.row.researcher_id,
      buildResearcherIntelligence(record, departmentRank, departmentTotal),
    );
  }

  return {
    researchers,
    publicationTrendByYear: buildPublicationTrendByYear(dataset.researchers),
    topTopics: buildTopTopics(dataset.researchers),
  };
}

type CachedIntelligenceIndex = Omit<IntelligenceIndex, "researchers"> & {
  researchers: Record<string, ResearcherIntelligence>;
};

const getIntelligenceIndexCached = unstable_cache(
  async (): Promise<CachedIntelligenceIndex> => {
    const dataset = await getAssistantDataset();
    const index = buildIntelligenceIndex(dataset);
    return {
      ...index,
      researchers: Object.fromEntries(index.researchers),
    };
  },
  ["research-intelligence-index-v2"],
  { revalidate: 300 },
);

export async function getIntelligenceIndex(): Promise<IntelligenceIndex> {
  const index = await getIntelligenceIndexCached();
  const researchers =
    index.researchers instanceof Map
      ? index.researchers
      : new Map(Object.entries(index.researchers ?? {}));

  return {
    ...index,
    researchers,
  };
}

export { buildIntelligenceIndex };
