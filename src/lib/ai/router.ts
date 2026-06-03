import {
  detectDepartmentFilter,
  detectRequestedTitles,
  extractResearcherId,
  isAggregateCountQuestion,
  normalizeText,
} from "@/lib/ai/researcher-meta";
import type { QueryIntentType, RoutedQuery } from "@/lib/ai/types";
import {
  expandQueryTokens,
  isCollaborationRankingQuestion,
  isCollaborationQuestion,
  isCollaborationTopic,
  isFundingQuestion,
  isFundingToResearchersQuestion,
  isIntelligenceProfileQuestion,
  isMatchFundingQuestion,
  isPublicationTrendQuestion,
  isPublicationTopicQuestion,
  isResearcherQuestion,
} from "@/lib/ai/text-utils";

export type RouteQueryOptions = {
  contextResearcherId?: string;
  isFollowUp?: boolean;
};

function detectResearcherProfileIntent(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    extractResearcherId(message) !== undefined ||
    /(โปรไฟล์|profile|รายละเอียด|ข้อมูลของ|เกี่ยวกับ|ประวัติ|การศึกษา|วุฒิ|ปริญญา|ความเชี่ยวชาญ|ผลงานที่ตีพิมพ์|ผลงานตีพิมพ์|publication|education|expertise|degree|เรียนจบ)/.test(
      normalized,
    )
  );
}

export function routeQuery(
  message: string,
  departments: string[],
  options: RouteQueryOptions = {},
): RoutedQuery {
  const queryTokens = expandQueryTokens(message);
  const titles = detectRequestedTitles(message);
  const department = detectDepartmentFilter(message, departments);
  const researcherId = extractResearcherId(message) ?? options.contextResearcherId;
  const isCountQuestion = isAggregateCountQuestion(message);
  const fundingQuestion = isFundingQuestion(message, queryTokens);
  const researcherQuestion = isResearcherQuestion(message, queryTokens);
  const matchFunding = isMatchFundingQuestion(message);
  const fundingToResearchersQuestion = isFundingToResearchersQuestion(message);
  const collaborationQuestion =
    isCollaborationQuestion(message) ||
    (options.isFollowUp &&
      !!options.contextResearcherId &&
      isCollaborationTopic(message));
  const collaborationRankingQuestion = isCollaborationRankingQuestion(message);
  const publicationTopicQuestion = isPublicationTopicQuestion(message);
  const publicationTrendQuestion =
    isPublicationTrendQuestion(message) ||
    (options.isFollowUp &&
      !!options.contextResearcherId &&
      /(ผลงาน|publication|ตีพิมพ์)/.test(normalizeText(message)) &&
      /(แนวโน้ม|trend|กี่|จำนวน|บ้าง|อะไร)/.test(normalizeText(message)));
  const intelligenceQuestion = isIntelligenceProfileQuestion(message);
  const profileFollowUp =
    options.isFollowUp &&
    !!options.contextResearcherId &&
    detectResearcherProfileIntent(message);

  const filters = {
    titles,
    department,
    researcherId,
  };

  let intent: QueryIntentType = "general";

  if (isCountQuestion) {
    intent = "count_researchers";
  } else if (intelligenceQuestion && researcherId) {
    intent = "researcher_intelligence";
  } else if (collaborationRankingQuestion) {
    intent = "collaboration_ranking";
  } else if (collaborationQuestion) {
    intent = "collaboration_network";
  } else if (publicationTopicQuestion) {
    intent = "search_by_publication";
  } else if (publicationTrendQuestion) {
    intent = "publication_trends";
  } else if (fundingToResearchersQuestion) {
    intent = "match_researchers_for_funding";
  } else if (matchFunding) {
    intent = "match_funding";
  } else if (profileFollowUp || (researcherId && detectResearcherProfileIntent(message))) {
    intent = "researcher_profile";
  } else if (fundingQuestion && !researcherQuestion) {
    intent = "search_fundings";
  } else if (researcherQuestion || titles.length > 0 || department) {
    intent = "search_researchers";
  }

  return {
    intent,
    message,
    filters,
    isCountQuestion,
    topicHint: message,
  };
}

export function intentStatusMessage(intent: QueryIntentType): string {
  switch (intent) {
    case "count_researchers":
      return "กำลังนับจำนวนนักวิจัยจากฐานข้อมูล...";
    case "search_researchers":
      return "กำลังค้นหานักวิจัยที่เกี่ยวข้อง...";
    case "researcher_profile":
      return "กำลังดึงโปรไฟล์นักวิจัย...";
    case "search_fundings":
      return "กำลังค้นหาแหล่งทุน...";
    case "match_funding":
      return "กำลังจับคู่ทุนที่เหมาะสม (Fit Score)...";
    case "match_researchers_for_funding":
      return "กำลังจับคู่นักวิจัยที่เหมาะกับทุน...";
    case "collaboration_network":
      return "กำลังวิเคราะห์เครือข่ายความร่วมมือ...";
    case "collaboration_ranking":
      return "กำลังจัดอันดับเครือข่ายความร่วมมือของนักวิจัย...";
    case "publication_trends":
      return "กำลังวิเคราะห์แนวโน้มผลงาน...";
    case "search_by_publication":
      return "กำลังค้นหานักวิจัยจากผลงานตีพิมพ์...";
    case "researcher_intelligence":
      return "กำลังวิเคราะห์ Research Intelligence Profile...";
    default:
      return "กำลังค้นหาข้อมูลด้วย Retrieval + Vector Search...";
  }
}
