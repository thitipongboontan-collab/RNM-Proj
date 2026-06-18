import { unstable_cache } from "next/cache";
import type { ResearchNewsDetail, ResearchNewsItem } from "@/data/research-news";
import { getResearchNewsGradient } from "@/data/research-news";
import { getMockResearchNewsById, RESEARCH_NEWS_MOCK } from "@/data/research-news-mock";
import { resolveNewsAttachmentUrl, resolveNewsImageSrc } from "@/lib/news-assets";
import { normalizeImagePosition } from "@/lib/image-position";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";
import { createSupabaseClient } from "@/lib/supabase/client";
import { normalizeThaiEventDateForDisplay } from "@/lib/thai-date";

const CACHE_REVALIDATE_SECONDS = 300;

const NEWS_LIST_SELECT_WITH_POSITION =
  "news_id, title, category, published_date, external_url, image_path, image_position, attachment_storage_path, view_count, display_order";
const NEWS_LIST_SELECT_BASE =
  "news_id, title, category, published_date, external_url, image_path, attachment_storage_path, view_count, display_order";
const NEWS_DETAIL_SELECT_WITH_POSITION =
  "news_id, title, category, published_date, details, external_url, image_path, image_position, attachment_file_name, attachment_storage_path, view_count, display_order";
const NEWS_DETAIL_SELECT_BASE =
  "news_id, title, category, published_date, details, external_url, image_path, attachment_file_name, attachment_storage_path, view_count, display_order";

type NewsRow = {
  news_id: string;
  title: string;
  category: string;
  published_date: string;
  details?: string;
  external_url: string | null;
  image_path: string | null;
  image_position?: string | null;
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
    imagePosition: normalizeImagePosition(row.image_position),
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

  const primary = await supabase.from("research_news").select(NEWS_LIST_SELECT_WITH_POSITION).order("display_order");
  let data = primary.data as NewsRow[] | null;
  let error = primary.error;

  if (error && isMissingSchemaError(error.message)) {
    const fallback = await supabase.from("research_news").select(NEWS_LIST_SELECT_BASE).order("display_order");
    data = fallback.data as NewsRow[] | null;
    error = fallback.error;
  }

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

  const primary = await supabase
    .from("research_news")
    .select(NEWS_DETAIL_SELECT_WITH_POSITION)
    .eq("news_id", id)
    .maybeSingle();
  let data = primary.data as NewsRow | null;
  let error = primary.error;

  if (error && isMissingSchemaError(error.message)) {
    const fallback = await supabase
      .from("research_news")
      .select(NEWS_DETAIL_SELECT_BASE)
      .eq("news_id", id)
      .maybeSingle();
    data = fallback.data as NewsRow | null;
    error = fallback.error;
  }

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
