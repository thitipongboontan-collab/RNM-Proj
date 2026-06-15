export type ResearchNewsItem = {
  id: string;
  category: string;
  title: string;
  publishedDate: string;
  views: number;
  imageGradient: string;
  imageSrc?: string;
  externalUrl?: string;
  attachmentUrl?: string;
};

export type ResearchNewsDetail = ResearchNewsItem & {
  details: string;
  attachmentFileName?: string;
};

export const RESEARCH_NEWS_GRADIENTS = [
  "linear-gradient(135deg, #6B5B4F 0%, #A8927A 55%, #D4C4A8 100%)",
  "linear-gradient(135deg, #2E4A6E 0%, #4A7BA7 55%, #7EB8E8 100%)",
  "linear-gradient(135deg, #1A3D5C 0%, #2563EB 50%, #60A5FA 100%)",
  "linear-gradient(135deg, #374151 0%, #6B7280 50%, #9CA3AF 100%)",
] as const;

export function getResearchNewsGradient(index: number): string {
  return RESEARCH_NEWS_GRADIENTS[index % RESEARCH_NEWS_GRADIENTS.length];
}

export const NEWS_CATEGORY_PRESETS = ["ประกาศ", "อบรม", "รายงาน", "อื่นๆ"] as const;
