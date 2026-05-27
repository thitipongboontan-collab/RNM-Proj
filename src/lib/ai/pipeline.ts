import { buildVectorScoreMap, searchWithEmbeddings } from "@/lib/assistant-embeddings";
import { intentStatusMessage, routeQuery } from "@/lib/ai/router";
import { matchFundingTool } from "@/lib/ai/tools/match-funding";
import { collaborationNetworkTool } from "@/lib/ai/tools/collaboration-network";
import { publicationTrendsTool } from "@/lib/ai/tools/publication-trends";
import { researcherIntelligenceTool } from "@/lib/ai/tools/intelligence";
import { buildFundingOverviewBlock, searchFundingsTool } from "@/lib/ai/tools/fundings";
import {
  buildResearcherOverviewBlock,
  countResearchersTool,
  getResearcherProfileTool,
  searchResearchersTool,
} from "@/lib/ai/tools/researchers";
import type { AssistantPipelineResult, Citation, ToolExecutionResult } from "@/lib/ai/types";
import { expandQueryTokens } from "@/lib/ai/text-utils";
import { getAssistantDataset } from "@/lib/assistant-dataset";

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const result: Citation[] = [];

  for (const citation of citations) {
    const key = `${citation.type}:${citation.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(citation);
  }

  return result;
}

function mergeToolResults(results: ToolExecutionResult[]): {
  contextBlocks: string[];
  citations: Citation[];
  toolsUsed: string[];
} {
  const contextBlocks: string[] = [];
  const citations: Citation[] = [];
  const toolsUsed: string[] = [];

  for (const result of results) {
    toolsUsed.push(result.name);
    contextBlocks.push(result.contextBlock);
    citations.push(...result.citations);
  }

  return {
    contextBlocks,
    citations: dedupeCitations(citations),
    toolsUsed,
  };
}

export async function runAssistantPipeline(
  message: string,
  apiKey?: string,
): Promise<AssistantPipelineResult> {
  const dataset = await getAssistantDataset();
  const departments = [...new Set(dataset.researchers.map((item) => item.row.department))];
  const routed = routeQuery(message, departments);
  const queryTokens = expandQueryTokens(message);

  let vectorScores = new Map<string, number>();
  if (apiKey) {
    try {
      const vectorResults = await searchWithEmbeddings(apiKey, dataset, message, 12);
      vectorScores = buildVectorScoreMap(vectorResults);
    } catch (error) {
      console.error("Vector search failed, falling back to keyword search:", error);
    }
  }

  const toolResults: ToolExecutionResult[] = [];

  switch (routed.intent) {
    case "count_researchers":
      toolResults.push(countResearchersTool(dataset.researchers, routed.filters));
      break;
    case "researcher_profile":
      if (routed.filters.researcherId) {
        const profile = getResearcherProfileTool(
          dataset.researchers,
          routed.filters.researcherId,
        );
        if (profile) toolResults.push(profile);
        const intelligence = researcherIntelligenceTool(
          dataset,
          routed.filters.researcherId,
        );
        if (intelligence) toolResults.push(intelligence);
      }
      toolResults.push(
        searchResearchersTool(
          dataset.researchers,
          queryTokens,
          vectorScores,
          routed.filters,
          6,
        ),
      );
      break;
    case "search_researchers":
      toolResults.push(
        searchResearchersTool(
          dataset.researchers,
          queryTokens,
          vectorScores,
          routed.filters,
          8,
        ),
      );
      break;
    case "search_fundings":
      toolResults.push(searchFundingsTool(dataset.fundings, queryTokens, vectorScores, 6));
      break;
    case "match_funding":
      toolResults.push(
        matchFundingTool(
          dataset,
          queryTokens,
          vectorScores,
          routed.filters.researcherId,
          5,
        ),
      );
      break;
    case "collaboration_network": {
      const network = collaborationNetworkTool(dataset, routed.filters.researcherId);
      if (network) toolResults.push(network);
      break;
    }
    case "publication_trends":
      toolResults.push(
        await publicationTrendsTool(dataset, routed.filters.researcherId),
      );
      break;
    case "researcher_intelligence":
      if (routed.filters.researcherId) {
        const intelligence = researcherIntelligenceTool(
          dataset,
          routed.filters.researcherId,
        );
        if (intelligence) toolResults.push(intelligence);
      }
      break;
    default:
      toolResults.push(
        searchResearchersTool(dataset.researchers, queryTokens, vectorScores, { titles: [] }, 6),
      );
      toolResults.push(searchFundingsTool(dataset.fundings, queryTokens, vectorScores, 3));
      break;
  }

  const merged = mergeToolResults(toolResults);

  const platformContext = [
    "=== Research Nexus AI Pipeline ===",
    `Intent: ${routed.intent}`,
    `Status: ${intentStatusMessage(routed.intent)}`,
    `Tools: ${merged.toolsUsed.join(", ")}`,
    "",
    "=== ภาพรวมระบบ (Retrieval Layer) ===",
    buildResearcherOverviewBlock(dataset.researchers),
    buildFundingOverviewBlock(dataset.fundings),
    "",
    ...merged.contextBlocks,
    "",
    routed.isCountQuestion
      ? "หมายเหตุ: คำถามนี้เกี่ยวกับจำนวน — ใช้ผลลัพธ์จาก TOOL count_researchers เท่านั้น ห้ามนับจากตัวอย่าง"
      : "หมายเหตุ: อ้างอิงข้อมูลจาก Tools และภาพรวมระบบ ทุกคำตอบต้องมี citation [RSxxx] หรือ [FDxxx]",
    vectorScores.size
      ? "Retrieval: Hybrid (Vector Search + Keyword + Structured Tools)"
      : "Retrieval: Keyword + Structured Tools",
  ].join("\n");

  return {
    platformContext,
    citations: merged.citations.slice(0, 12),
    intent: routed.intent,
    toolsUsed: merged.toolsUsed,
  };
}

export async function buildAssistantPlatformContext(
  message: string,
  apiKey?: string,
): Promise<string> {
  const result = await runAssistantPipeline(message, apiKey);
  return result.platformContext;
}

export { intentStatusMessage };
