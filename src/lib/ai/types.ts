export type Citation = {
  id: string;
  type: "researcher" | "funding";
  label: string;
  href: string;
};

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type QueryIntentType =
  | "count_researchers"
  | "search_researchers"
  | "researcher_profile"
  | "search_fundings"
  | "match_funding"
  | "match_researchers_for_funding"
  | "collaboration_network"
  | "collaboration_ranking"
  | "publication_trends"
  | "search_by_publication"
  | "researcher_intelligence"
  | "general";

export type ResearcherFilters = {
  titles: string[];
  department?: string;
  researcherId?: string;
};

export type RoutedQuery = {
  intent: QueryIntentType;
  message: string;
  filters: ResearcherFilters;
  isCountQuestion: boolean;
  topicHint?: string;
};

export type ToolExecutionResult = {
  name: string;
  summary: string;
  contextBlock: string;
  citations: Citation[];
};

export type AssistantPipelineResult = {
  platformContext: string;
  citations: Citation[];
  intent: QueryIntentType;
  toolsUsed: string[];
};
