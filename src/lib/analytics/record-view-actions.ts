"use server";

import {
  incrementFundingViews,
  incrementResearcherViews,
  incrementResearchNewsViews,
} from "@/lib/analytics/views";

export async function recordResearcherView(researcherId: string): Promise<boolean> {
  return incrementResearcherViews(researcherId);
}

export async function recordFundingView(fundingId: string): Promise<boolean> {
  return incrementFundingViews(fundingId);
}

export async function recordNewsView(newsId: string): Promise<boolean> {
  return incrementResearchNewsViews(newsId);
}
