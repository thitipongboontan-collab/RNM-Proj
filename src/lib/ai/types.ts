export type Citation = {
  id: string;
  type: "researcher" | "funding";
  label: string;
  href: string;
};

export type QueryIntentType =
  | "count_researchers"
  | "search_researchers"
  | "researcher_profile"
  | "search_fundings"
  | "match_funding"
  | "collaboration_network"
  | "publication_trends"
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
