import { unstable_cache } from "next/cache";
import type { ResearchNewsDetail, ResearchNewsItem } from "@/data/research-news";
import { getResearchNewsGradient } from "@/data/research-news";
import { getMockResearchNewsById, RESEARCH_NEWS_MOCK } from "@/data/research-news-mock";
import { resolveNewsAttachmentUrl, resolveNewsImageSrc } from "@/lib/news-assets";
import { createSupabaseClient } from "@/lib/supabase/client";
import { normalizeThaiEventDateForDisplay } from "@/lib/thai-date";

const CACHE_REVALIDATE_SECONDS = 300;

type NewsRow = {
  news_id: string;
  title: string;
  category: string;
  published_date: string;
  details?: string;
  external_url: string | null;
  image_path: string | null;
  attachment_file_name: string | null;
  attachment_storage_path: string | null;
  view_count: number | null;
  display_order: number | null;
};

function mapNewsRow(row: NewsRow, index: number): ResearchNewsItem {
  return {
    id: row.news_id,
    category: row.category,
    title: row.title,
    publishedDate: normalizeThaiEventDateForDisplay(row.published_date),
    views: row.view_count ?? 0,
    imageGradient: getResearchNewsGradient(index),
    imageSrc: resolveNewsImageSrc(row.image_path),
    externalUrl: row.external_url ?? undefined,
    attachmentUrl: resolveNewsAttachmentUrl(row.attachment_storage_path),
  };
}

function mapNewsDetailRow(row: NewsRow, index: number): ResearchNewsDetail {
  return {
    ...mapNewsRow(row, index),
    details: row.details ?? "",
    attachmentFileName: row.attachment_file_name ?? undefined,
  };
}

function loadMockNews(): ResearchNewsItem[] {
  return RESEARCH_NEWS_MOCK;
}

async function fetchResearchNewsFromDb(): Promise<ResearchNewsItem[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return loadMockNews();

  const { data, error } = await supabase
    .from("research_news")
    .select(
      "news_id, title, category, published_date, external_url, image_path, attachment_storage_path, view_count, display_order",
    )
    .order("display_order");

  if (error || !data?.length) {
    if (error) console.error("Failed to fetch research news:", error.message);
    return loadMockNews();
  }

  return (data as NewsRow[]).map((row, index) => mapNewsRow(row, index));
}

const getResearchNewsCached = unstable_cache(fetchResearchNewsFromDb, ["research-news"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["research-news"],
});

export async function getResearchNews(): Promise<ResearchNewsItem[]> {
  return getResearchNewsCached();
}

export async function getResearchNewsCount(): Promise<number> {
  const items = await getResearchNews();
  return items.length;
}

async function fetchResearchNewsByIdFromDb(id: string): Promise<ResearchNewsDetail | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return getMockResearchNewsById(id);

  const { data, error } = await supabase
    .from("research_news")
    .select(
      "news_id, title, category, published_date, details, external_url, image_path, attachment_file_name, attachment_storage_path, view_count, display_order",
    )
    .eq("news_id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch research news detail:", error.message);
    return getMockResearchNewsById(id);
  }

  if (!data) return getMockResearchNewsById(id);

  return mapNewsDetailRow(data as NewsRow, 0);
}

export async function getResearchNewsById(id: string): Promise<ResearchNewsDetail | null> {
  return fetchResearchNewsByIdFromDb(id);
}
