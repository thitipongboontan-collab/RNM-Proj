import { buildVectorScoreMap, searchWithEmbeddings } from "@/lib/assistant-embeddings";
import {
  formatConversationHistoryBlock,
  resolveConversationContext,
} from "@/lib/ai/conversation-context";
import { intentStatusMessage, routeQuery } from "@/lib/ai/router";
import { findResearchersByNameQuery } from "@/lib/ai/researcher-meta";
import { matchFundingTool } from "@/lib/ai/tools/match-funding";
import { matchResearchersForFundingTool } from "@/lib/ai/tools/match-researchers-for-funding";
import { collaborationCountriesTool } from "@/lib/ai/tools/collaboration-countries";
import {
  collaborationNetworkTool,
  collaborationOrganizationTool,
  collaborationRankingTool,
} from "@/lib/ai/tools/collaboration-network";
import { publicationTrendsTool } from "@/lib/ai/tools/publication-trends";
import { publicationCountTool } from "@/lib/ai/tools/publication-stats";
import { searchResearchersByPublicationTool } from "@/lib/ai/tools/publication-search";
import { researcherIntelligenceTool } from "@/lib/ai/tools/intelligence";
import { buildFundingOverviewBlock, searchFundingsTool } from "@/lib/ai/tools/fundings";
import {
  buildResearcherOverviewBlock,
  countResearchersTool,
  getResearcherProfileTool,
  searchResearchersTool,
} from "@/lib/ai/tools/researchers";
import type { AssistantPipelineResult, Citation, ConversationTurn, ToolExecutionResult } from "@/lib/ai/types";
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

function attachResolvedResearcherProfiles(
  toolResults: ToolExecutionResult[],
  dataset: Awaited<ReturnType<typeof getAssistantDataset>>,
  researcherIds: string[],
) {
  const citedIds = new Set(
    toolResults.flatMap((result) =>
      result.citations.filter((item) => item.type === "researcher").map((item) => item.id),
    ),
  );

  for (const researcherId of researcherIds.slice(0, 3)) {
    if (citedIds.has(researcherId)) continue;
    const profile = getResearcherProfileTool(dataset.researchers, researcherId);
    if (profile) toolResults.push(profile);
  }
}

export async function runAssistantPipeline(
  message: string,
  apiKey?: string,
  history: ConversationTurn[] = [],
): Promise<AssistantPipelineResult> {
  const dataset = await getAssistantDataset();
  const departments = [...new Set(dataset.researchers.map((item) => item.row.department))];
  const conversation = resolveConversationContext(message, history, dataset.researchers);
  const pipelineMessage = conversation.effectiveMessage;
  const routed = routeQuery(pipelineMessage, departments, {
    contextResearcherId: conversation.primaryResearcherId,
    isFollowUp: conversation.isFollowUp,
  });
  const queryTokens = expandQueryTokens(pipelineMessage);
  const resolvedResearcherIds = [
    ...new Set([
      ...conversation.contextResearcherIds,
      ...findResearchersByNameQuery(pipelineMessage, dataset.researchers, 3),
    ]),
  ];
  const primaryResearcherId =
    routed.filters.researcherId ?? conversation.primaryResearcherId ?? resolvedResearcherIds[0];
  const filters = {
    ...routed.filters,
    researcherId: primaryResearcherId,
  };

  let vectorScores = new Map<string, number>();
  if (apiKey) {
    try {
      const vectorResults = await searchWithEmbeddings(apiKey, dataset, pipelineMessage, 16);
      vectorScores = buildVectorScoreMap(vectorResults);
    } catch (error) {
      console.error("Vector search failed, falling back to keyword search:", error);
    }
  }

  const toolResults: ToolExecutionResult[] = [];
  const collaborationOrganizationLookup = collaborationOrganizationTool(dataset, pipelineMessage);

  switch (routed.intent) {
    case "count_researchers":
      toolResults.push(countResearchersTool(dataset.researchers, routed.filters));
      break;
    case "researcher_profile":
      if (filters.researcherId) {
        const profile = getResearcherProfileTool(
          dataset.researchers,
          filters.researcherId,
        );
        if (profile) toolResults.push(profile);
        const intelligence = researcherIntelligenceTool(
          dataset,
          filters.researcherId,
        );
        if (intelligence) toolResults.push(intelligence);
      }
      toolResults.push(
        searchResearchersTool(
          dataset.researchers,
          queryTokens,
          vectorScores,
          filters,
          6,
        ),
      );
      break;
    case "search_researchers":
      if (filters.researcherId) {
        const profile = getResearcherProfileTool(dataset.researchers, filters.researcherId);
        if (profile) toolResults.push(profile);
      }
      toolResults.push(
        searchResearchersTool(
          dataset.researchers,
          queryTokens,
          vectorScores,
          filters,
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
          filters.researcherId,
          5,
        ),
      );
      break;
    case "match_researchers_for_funding": {
      const fundingMatch = matchResearchersForFundingTool(
        dataset,
        message,
        queryTokens,
        vectorScores,
        undefined,
        10,
      );
      if (fundingMatch) {
        toolResults.push(fundingMatch);
      } else {
        toolResults.push(searchFundingsTool(dataset.fundings, queryTokens, vectorScores, 3));
        toolResults.push(
          searchResearchersTool(dataset.researchers, queryTokens, vectorScores, filters, 8),
        );
      }
      break;
    }
    case "collaboration_network": {
      if (filters.researcherId) {
        const profile = getResearcherProfileTool(dataset.researchers, filters.researcherId);
        if (profile) toolResults.push(profile);
      }
      if (collaborationOrganizationLookup) {
        toolResults.push(collaborationOrganizationLookup);
      }
      if (filters.researcherId || !collaborationOrganizationLookup) {
        const network = collaborationNetworkTool(dataset, filters.researcherId);
        if (network) toolResults.push(network);
      }
      break;
    }
    case "collaboration_ranking":
      toolResults.push(collaborationRankingTool(dataset, 10));
      break;
    case "collaboration_countries":
      if (filters.researcherId) {
        const profile = getResearcherProfileTool(dataset.researchers, filters.researcherId);
        if (profile) toolResults.push(profile);
      }
      toolResults.push(collaborationCountriesTool(dataset, filters));
      break;
    case "publication_count":
      if (filters.researcherId) {
        const profile = getResearcherProfileTool(dataset.researchers, filters.researcherId);
        if (profile) toolResults.push(profile);
      }
      toolResults.push(publicationCountTool(dataset.researchers, filters));
      break;
    case "search_by_publication": {
      const publicationSearch = searchResearchersByPublicationTool(
        dataset.researchers,
        message,
        filters,
        8,
      );
      if (publicationSearch) {
        toolResults.push(publicationSearch);
      } else {
        toolResults.push(
          searchResearchersTool(
            dataset.researchers,
            queryTokens,
            vectorScores,
            filters,
            8,
          ),
        );
      }
      break;
    }
    case "publication_trends":
      toolResults.push(
        await publicationTrendsTool(dataset, filters.researcherId),
      );
      break;
    case "researcher_intelligence":
      if (filters.researcherId) {
        const intelligence = researcherIntelligenceTool(
          dataset,
          filters.researcherId,
        );
        if (intelligence) toolResults.push(intelligence);
      }
      break;
    default:
      if (collaborationOrganizationLookup) {
        toolResults.push(collaborationOrganizationLookup);
        break;
      }
      attachResolvedResearcherProfiles(toolResults, dataset, resolvedResearcherIds);
      toolResults.push(
        searchResearchersTool(dataset.researchers, queryTokens, vectorScores, { titles: [] }, 8),
      );
      toolResults.push(searchFundingsTool(dataset.fundings, queryTokens, vectorScores, 3));
      break;
  }

  if (resolvedResearcherIds.length && routed.intent !== "count_researchers") {
    attachResolvedResearcherProfiles(toolResults, dataset, resolvedResearcherIds);
  }

  const merged = mergeToolResults(toolResults);
  const historyBlock = formatConversationHistoryBlock(history);

  const platformContext = [
    "=== Research Nexus AI Pipeline ===",
    `Intent: ${routed.intent}`,
    conversation.isFollowUp ? "Follow-up: yes (resolved from conversation history)" : "Follow-up: no",
    conversation.primaryResearcherId
      ? `Context researcher: ${conversation.primaryResearcherId}`
      : "",
    `Status: ${intentStatusMessage(routed.intent)}`,
    `Tools: ${merged.toolsUsed.join(", ")}`,
    "",
    historyBlock,
    historyBlock ? "" : "",
    "=== ภาพรวมระบบ (Retrieval Layer) ===",
    buildResearcherOverviewBlock(dataset.researchers),
    buildFundingOverviewBlock(dataset.fundings),
    "",
    ...merged.contextBlocks,
    "",
    routed.isCountQuestion && routed.intent === "count_researchers"
      ? "หมายเหตุ: คำถามนี้เกี่ยวกับจำนวนนักวิจัย — ใช้ผลลัพธ์จาก TOOL count_researchers เท่านั้น ห้ามนับจากตัวอย่าง"
      : routed.intent === "publication_count"
        ? "หมายเหตุ: คำถามนี้เกี่ยวกับจำนวนผลงานตีพิมพ์ — ใช้ผลลัพธ์จาก TOOL publication_count เท่านั้น"
        : routed.intent === "collaboration_countries"
          ? "หมายเหตุ: คำถามนี้เกี่ยวกับจำนวนประเทศในเครือข่ายความร่วมมือ — ใช้ผลลัพธ์จาก TOOL collaboration_countries เท่านั้น"
          : conversation.isFollowUp
        ? "หมายเหตุ: คำถามนี้เป็นคำถามต่อเนื่อง — ให้ตอบใน context ของนักวิจัยที่อ้างถึงจากประวัติการสนทนา และใช้ข้อมูลจาก Tools ด้านล่าง"
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
  history: ConversationTurn[] = [],
): Promise<string> {
  const result = await runAssistantPipeline(message, apiKey, history);
  return result.platformContext;
}

export { intentStatusMessage };
