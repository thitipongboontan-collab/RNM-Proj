import { SITE_PAGE_KEYS, SITE_PAGE_LABELS, type SitePageKey } from "@/lib/analytics/site-pages";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export type AdminAnalyticsPageView = {
  pageKey: SitePageKey;
  label: string;
  viewCount: number;
};

export type AdminAnalyticsTopItem = {
  id: string;
  title: string;
  viewCount: number;
};

export type AdminAnalyticsSummary = {
  totalPageViews: number;
  totalNewsViews: number;
  totalFundingViews: number;
  totalResearcherViews: number;
  totalContentViews: number;
  pageViews: AdminAnalyticsPageView[];
  topNews: AdminAnalyticsTopItem[];
  topFundings: AdminAnalyticsTopItem[];
  topResearchers: AdminAnalyticsTopItem[];
};

function getAdminClient() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
}

function sumViewCounts(rows: { view_count: number | null }[] | null | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (row.view_count ?? 0), 0);
}

export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const supabase = getAdminClient();

  const [pageViewsResult, newsResult, fundingsResult, researchersResult] = await Promise.all([
    supabase.from("site_page_views").select("page_key, view_count").order("page_key"),
    supabase.from("research_news").select("news_id, title, view_count").order("view_count", { ascending: false }).limit(5),
    supabase.from("fundings").select("funding_id, title, view_count").order("view_count", { ascending: false }).limit(5),
    supabase
      .from("researchers")
      .select("researcher_id, name_th, view_count")
      .order("view_count", { ascending: false })
      .limit(5),
  ]);

  if (pageViewsResult.error) throw new Error(pageViewsResult.error.message);
  if (newsResult.error) throw new Error(newsResult.error.message);
  if (fundingsResult.error) throw new Error(fundingsResult.error.message);
  if (researchersResult.error) throw new Error(researchersResult.error.message);

  const [allNewsViews, allFundingViews, allResearcherViews] = await Promise.all([
    supabase.from("research_news").select("view_count"),
    supabase.from("fundings").select("view_count"),
    supabase.from("researchers").select("view_count"),
  ]);

  if (allNewsViews.error) throw new Error(allNewsViews.error.message);
  if (allFundingViews.error) throw new Error(allFundingViews.error.message);
  if (allResearcherViews.error) throw new Error(allResearcherViews.error.message);

  const pageViewMap = new Map(
    (pageViewsResult.data ?? []).map((row) => [row.page_key, row.view_count ?? 0]),
  );

  const pageViews = Object.values(SITE_PAGE_KEYS).map((pageKey) => ({
    pageKey,
    label: SITE_PAGE_LABELS[pageKey],
    viewCount: pageViewMap.get(pageKey) ?? 0,
  }));

  const totalPageViews = pageViews.reduce((sum, item) => sum + item.viewCount, 0);
  const totalNewsViews = sumViewCounts(allNewsViews.data);
  const totalFundingViews = sumViewCounts(allFundingViews.data);
  const totalResearcherViews = sumViewCounts(allResearcherViews.data);

  return {
    totalPageViews,
    totalNewsViews,
    totalFundingViews,
    totalResearcherViews,
    totalContentViews: totalNewsViews + totalFundingViews + totalResearcherViews,
    pageViews,
    topNews: (newsResult.data ?? []).map((row) => ({
      id: row.news_id,
      title: row.title,
      viewCount: row.view_count ?? 0,
    })),
    topFundings: (fundingsResult.data ?? []).map((row) => ({
      id: row.funding_id,
      title: row.title,
      viewCount: row.view_count ?? 0,
    })),
    topResearchers: (researchersResult.data ?? []).map((row) => ({
      id: row.researcher_id,
      title: row.name_th,
      viewCount: row.view_count ?? 0,
    })),
  };
}
