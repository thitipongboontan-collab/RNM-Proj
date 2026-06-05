import { filterResearchersByTitles } from "@/lib/ai/researcher-meta";
import type { ResearcherFilters } from "@/lib/ai/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

export function applyResearcherFilters(
  records: ResearcherRecord[],
  filters: ResearcherFilters,
): ResearcherRecord[] {
  let filtered = records;

  if (filters.titles.length) {
    filtered = filterResearchersByTitles(filtered, filters.titles);
  }

  if (filters.department) {
    filtered = filtered.filter((record) => record.row.department === filters.department);
  }

  if (filters.researcherId) {
    filtered = filtered.filter((record) => record.row.researcher_id === filters.researcherId);
  }

  return filtered;
}
