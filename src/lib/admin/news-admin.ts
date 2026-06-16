import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type {
  AdminNewsFormInput,
  AdminNewsListItem,
  AdminNewsRecord,
} from "@/lib/admin/news-types";
import { removeNewsAttachment, removeNewsImage, uploadNewsAttachment, uploadNewsImage } from "@/lib/admin/news-upload";
import { normalizeThaiEventDateForDisplay } from "@/lib/thai-date";

type NewsRow = {
  news_id: string;
  title: string;
  category: string;
  published_date: string;
  details: string;
  external_url: string | null;
  image_path: string | null;
  attachment_file_name: string | null;
  attachment_storage_path: string | null;
  view_count: number | null;
  display_order: number | null;
};

function getAdminClient() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
}

function mapNewsRecord(row: NewsRow): AdminNewsRecord {
  return {
    newsId: row.news_id,
    title: row.title,
    category: row.category,
    publishedDate: normalizeThaiEventDateForDisplay(row.published_date),
    details: row.details,
    externalUrl: row.external_url ?? "",
    imagePath: row.image_path,
    attachmentFileName: row.attachment_file_name,
    attachmentStoragePath: row.attachment_storage_path,
    viewCount: row.view_count ?? 0,
    displayOrder: row.display_order ?? 0,
  };
}

export async function listAdminNews(): Promise<AdminNewsListItem[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("research_news")
    .select("news_id, title, category, published_date, view_count, display_order")
    .order("display_order");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as NewsRow[]).map((row) => ({
    newsId: row.news_id,
    title: row.title,
    category: row.category,
    publishedDate: normalizeThaiEventDateForDisplay(row.published_date),
    viewCount: row.view_count ?? 0,
    displayOrder: row.display_order ?? 0,
  }));
}

export async function getAdminNewsById(id: string): Promise<AdminNewsRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("research_news")
    .select(
      "news_id, title, category, published_date, details, external_url, image_path, attachment_file_name, attachment_storage_path, view_count, display_order",
    )
    .eq("news_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  return mapNewsRecord(data as NewsRow);
}

async function generateNextNewsId(): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("research_news")
    .select("news_id")
    .order("news_id", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const lastId = data?.[0]?.news_id ?? "NEWS000";
  const numeric = Number.parseInt(String(lastId).replace(/^NEWS/i, ""), 10);
  const next = Number.isFinite(numeric) ? numeric + 1 : 1;
  return `NEWS${String(next).padStart(3, "0")}`;
}

async function shiftExistingNewsForNewItem(): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("research_news").select("news_id, display_order");

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.length) return;

  const updates = await Promise.all(
    data.map((row) =>
      supabase
        .from("research_news")
        .update({ display_order: (row.display_order ?? 0) + 1 })
        .eq("news_id", row.news_id),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

export async function createAdminNews(
  input: AdminNewsFormInput,
  imageFile: File | null,
  attachmentFile: File | null,
): Promise<string> {
  const supabase = getAdminClient();
  const newsId = await generateNextNewsId();

  await shiftExistingNewsForNewItem();

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadNewsImage(newsId, imageFile);
  }

  let attachmentFileName: string | null = null;
  let attachmentStoragePath: string | null = null;
  if (attachmentFile && attachmentFile.size > 0) {
    const uploaded = await uploadNewsAttachment(newsId, attachmentFile);
    attachmentFileName = uploaded.fileName;
    attachmentStoragePath = uploaded.storagePath;
  }

  const { error } = await supabase.from("research_news").insert({
    news_id: newsId,
    title: input.title.trim(),
    category: input.category.trim(),
    published_date: normalizeThaiEventDateForDisplay(input.publishedDate.trim()),
    details: input.details.trim(),
    external_url: input.externalUrl.trim() || null,
    image_path: imagePath,
    attachment_file_name: attachmentFileName,
    attachment_storage_path: attachmentStoragePath,
    display_order: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  return newsId;
}

export async function updateAdminNews(
  newsId: string,
  input: AdminNewsFormInput,
  imageFile: File | null,
  removeImage: boolean,
  attachmentFile: File | null,
  removeAttachment: boolean,
): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminNewsById(newsId);
  if (!existing) {
    throw new Error("News not found.");
  }

  let imagePath = existing.imagePath;

  if (removeImage && imagePath) {
    await removeNewsImage(imagePath);
    imagePath = null;
  }

  if (imageFile && imageFile.size > 0) {
    if (imagePath) {
      await removeNewsImage(imagePath);
    }
    imagePath = await uploadNewsImage(newsId, imageFile);
  }

  let attachmentFileName = existing.attachmentFileName;
  let attachmentStoragePath = existing.attachmentStoragePath;

  if (removeAttachment && attachmentStoragePath) {
    await removeNewsAttachment(attachmentStoragePath);
    attachmentFileName = null;
    attachmentStoragePath = null;
  }

  if (attachmentFile && attachmentFile.size > 0) {
    if (attachmentStoragePath) {
      await removeNewsAttachment(attachmentStoragePath);
    }
    const uploaded = await uploadNewsAttachment(newsId, attachmentFile);
    attachmentFileName = uploaded.fileName;
    attachmentStoragePath = uploaded.storagePath;
  }

  const { error } = await supabase
    .from("research_news")
    .update({
      title: input.title.trim(),
      category: input.category.trim(),
      published_date: normalizeThaiEventDateForDisplay(input.publishedDate.trim()),
      details: input.details.trim(),
      external_url: input.externalUrl.trim() || null,
      image_path: imagePath,
      attachment_file_name: attachmentFileName,
      attachment_storage_path: attachmentStoragePath,
      display_order: input.displayOrder ?? existing.displayOrder,
    })
    .eq("news_id", newsId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAdminNews(newsId: string): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminNewsById(newsId);
  if (!existing) return;

  if (existing.attachmentStoragePath) {
    await removeNewsAttachment(existing.attachmentStoragePath);
  }

  if (existing.imagePath) {
    await removeNewsImage(existing.imagePath);
  }

  const { error } = await supabase.from("research_news").delete().eq("news_id", newsId);
  if (error) {
    throw new Error(error.message);
  }
}
