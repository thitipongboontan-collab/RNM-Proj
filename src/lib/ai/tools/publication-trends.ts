import {
  buildResearcherPublicationTrend,
  formatPublicationTrendBlock,
} from "@/lib/ai/intelligence/publication-trends";
import { getIntelligenceIndex } from "@/lib/ai/intelligence/index";
import type { ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";

export async function publicationTrendsTool(
  dataset: AssistantDataset,
  researcherId?: string,
): Promise<ToolExecutionResult> {
  const index = await getIntelligenceIndex();
  const researcher = researcherId
    ? dataset.researchers.find((row) => row.row.researcher_id === researcherId)
    : undefined;

  const researcherTrend = researcher ? buildResearcherPublicationTrend(researcher) : undefined;

  return {
    name: "publication_trends",
    summary: researcherId
      ? `แนวโน้มผลงาน ${researcherId} + ภาพรวมคณะ`
      : "แนวโน้มผลงานทั้งคณะ",
    contextBlock: formatPublicationTrendBlock(
      index.publicationTrendByYear,
      index.topTopics,
      researcherTrend,
      researcherId,
    ),
    citations: [],
  };
}
