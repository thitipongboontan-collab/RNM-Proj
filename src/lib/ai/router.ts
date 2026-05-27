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
  isCollaborationQuestion,
  isFundingQuestion,
  isIntelligenceProfileQuestion,
  isMatchFundingQuestion,
  isPublicationTrendQuestion,
  isResearcherQuestion,
} from "@/lib/ai/text-utils";

function detectResearcherProfileIntent(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    extractResearcherId(message) !== undefined ||
    /(โปรไฟล์|profile|รายละเอียด|ข้อมูลของ|เกี่ยวกับ)/.test(normalized)
  );
}

export function routeQuery(message: string, departments: string[]): RoutedQuery {
  const queryTokens = expandQueryTokens(message);
  const titles = detectRequestedTitles(message);
  const department = detectDepartmentFilter(message, departments);
  const researcherId = extractResearcherId(message);
  const isCountQuestion = isAggregateCountQuestion(message);
  const fundingQuestion = isFundingQuestion(message, queryTokens);
  const researcherQuestion = isResearcherQuestion(message, queryTokens);
  const matchFunding = isMatchFundingQuestion(message);
  const collaborationQuestion = isCollaborationQuestion(message);
  const publicationTrendQuestion = isPublicationTrendQuestion(message);
  const intelligenceQuestion = isIntelligenceProfileQuestion(message);

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
  } else if (collaborationQuestion) {
    intent = "collaboration_network";
  } else if (publicationTrendQuestion) {
    intent = "publication_trends";
  } else if (matchFunding) {
    intent = "match_funding";
  } else if (researcherId && detectResearcherProfileIntent(message)) {
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
    case "collaboration_network":
      return "กำลังวิเคราะห์เครือข่ายความร่วมมือ...";
    case "publication_trends":
      return "กำลังวิเคราะห์แนวโน้มผลงาน...";
    case "researcher_intelligence":
      return "กำลังวิเคราะห์ Research Intelligence Profile...";
    default:
      return "กำลังค้นหาข้อมูลด้วย Retrieval + Vector Search...";
  }
}
