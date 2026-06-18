import { unstable_cache } from "next/cache";
import fundingImportData from "@/data/funding-import.json";
import type {
  FundingAttachment,
  FundingDetailContent,
  FundingItem,
  FundingListItem,
} from "@/data/funding";
import { parseFundingDetails } from "@/lib/funding-content";
import { createSupabaseClient } from "@/lib/supabase/client";
import { abbreviateThaiMonthsInText } from "@/lib/thai-date";
import { resolveFundingDocumentUrl, resolveFundingImageSrc } from "@/lib/funding-assets";
import { normalizeImagePosition } from "@/lib/image-position";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";

const CACHE_REVALIDATE_SECONDS = 300;

const FUNDING_SUMMARY_SELECT_WITH_POSITION =
  "funding_id, title, organization, status_label, published_date, open_date, close_date, image_path, image_position, display_order";
const FUNDING_SUMMARY_SELECT_BASE =
  "funding_id, title, organization, status_label, published_date, open_date, close_date, image_path, display_order";
const FUNDING_FULL_SELECT_WITH_POSITION =
  "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, image_position, display_order";
const FUNDING_FULL_SELECT_BASE =
  "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, display_order";

type FundingImportRecord = {
  id: string;
  fundingCode: string;
  title: string;
  organization: string;
  openDate: string;
  closeDate: string;
  publishedDate: string;
  statusLabel: string;
  imageSrc?: string;
  imageVariant: 1 | 2 | 3;
  sourceUrl?: string;
  details: string;
  attachments: FundingAttachment[];
};

type FundingRow = {
  funding_id: string;
  funding_code: string;
  title: string;
  full_title: string;
  organization: string;
  status_label: string;
  published_date: string;
  open_date: string;
  close_date: string;
  source_url: string | null;
  details: string;
  image_path: string | null;
  image_position?: string | null;
  display_order: number | null;
};

type AttachmentRow = {
  id: number;
  funding_id: string;
  file_name: string;
  file_type: "pdf" | "doc";
  storage_path: string;
  file_order: number | null;
};

function formatOpenDate(value: string) {
  const label = value.startsWith("เปิดรับ") ? value : `เปิดรับวันที่ ${value}`;
  return abbreviateThaiMonthsInText(label);
}

function formatCloseDate(value: string) {
  const label = value.startsWith("ปิดรับ") ? value : `ปิดรับวันที่ ${value}`;
  return abbreviateThaiMonthsInText(label);
}

function buildDetail(
  row: Pick<
    FundingRow,
    "full_title" | "organization" | "published_date" | "details" | "source_url"
  >,
  attachments: FundingAttachment[],
  detailImages: string[] = [],
): FundingDetailContent {
  const parsed = parseFundingDetails(row.details, row.source_url ?? undefined);

  return {
    fullTitle: row.full_title,
    organization: row.organization,
    publishedDate: row.published_date,
    downloadLabel: "ดาวน์โหลดไฟล์ที่เกี่ยวข้อง",
    attachments,
    detailImages,
    ...parsed,
  };
}

function mapImportRecord(record: FundingImportRecord): FundingItem {
  return {
    id: record.id,
    title: record.title,
    organization: record.organization,
    openDate: formatOpenDate(record.openDate),
    closeDate: formatCloseDate(record.closeDate),
    publishedDate: record.publishedDate,
    imageVariant: record.imageVariant,
    imageSrc: record.imageSrc,
    statusLabel: record.statusLabel,
    detail: buildDetail(
      {
        full_title: record.title,
        organization: record.organization,
        published_date: record.publishedDate,
        details: record.details,
        source_url: record.sourceUrl ?? null,
      },
      record.attachments,
    ),
  };
}

function mapImportSummary(record: FundingImportRecord): FundingListItem {
  return {
    id: record.id,
    title: record.title,
    organization: record.organization,
    openDate: formatOpenDate(record.openDate),
    closeDate: formatCloseDate(record.closeDate),
    publishedDate: record.publishedDate,
    imageVariant: record.imageVariant,
    imageSrc: record.imageSrc,
    statusLabel: record.statusLabel,
  };
}

type DetailImageRow = {
  id: number;
  funding_id: string;
  storage_path: string;
  image_order: number | null;
};

function mapDetailImageRow(row: DetailImageRow): string {
  return resolveFundingImageSrc(row.storage_path) ?? row.storage_path;
}

function mapAttachmentRow(row: AttachmentRow): FundingAttachment {
  return {
    id: String(row.id),
    fileName: row.file_name,
    type: row.file_type,
    downloadUrl: resolveFundingDocumentUrl(row.storage_path),
  };
}

function mapFundingSummaryRow(row: FundingRow, imageVariant: 1 | 2 | 3): FundingListItem {
  return {
    id: row.funding_id,
    title: row.title,
    organization: row.organization,
    openDate: formatOpenDate(row.open_date),
    closeDate: formatCloseDate(row.close_date),
    publishedDate: row.published_date,
    imageVariant,
    imageSrc: resolveFundingImageSrc(row.image_path),
    imagePosition: normalizeImagePosition(row.image_position),
    statusLabel: row.status_label,
  };
}

function mapFundingRow(
  row: FundingRow,
  attachments: FundingAttachment[],
  detailImages: string[],
  imageVariant: 1 | 2 | 3,
): FundingItem {
  return {
    ...mapFundingSummaryRow(row, imageVariant),
    detail: buildDetail(row, attachments, detailImages),
  };
}

function loadImportCache(): FundingItem[] {
  return (fundingImportData as FundingImportRecord[]).map(mapImportRecord);
}

function loadImportSummaryCache(): FundingListItem[] {
  return (fundingImportData as FundingImportRecord[]).map(mapImportSummary);
}

async function fetchFundingSummariesFromDb(): Promise<FundingListItem[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return loadImportSummaryCache();

  const summarySelectWithPosition = FUNDING_SUMMARY_SELECT_WITH_POSITION;
  const summarySelectBase = FUNDING_SUMMARY_SELECT_BASE;

  const primary = await supabase.from("fundings").select(summarySelectWithPosition).order("display_order");
  let data = primary.data as FundingRow[] | null;
  let error = primary.error;

  if (error && isMissingSchemaError(error.message)) {
    const fallback = await supabase.from("fundings").select(summarySelectBase).order("display_order");
    data = fallback.data as FundingRow[] | null;
    error = fallback.error;
  }

  if (error || !data?.length) {
    if (error) console.error("Failed to fetch fundings:", error.message);
    return loadImportSummaryCache();
  }

  return (data as FundingRow[]).map((row, index) =>
    mapFundingSummaryRow(row, ((index % 3) + 1) as 1 | 2 | 3),
  );
}

async function fetchFundingsFromDb(): Promise<FundingItem[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return loadImportCache();

  const fullSelectWithPosition = FUNDING_FULL_SELECT_WITH_POSITION;
  const fullSelectBase = FUNDING_FULL_SELECT_BASE;

  const primary = await supabase.from("fundings").select(fullSelectWithPosition).order("display_order");
  let data = primary.data as FundingRow[] | null;
  let error = primary.error;

  if (error && isMissingSchemaError(error.message)) {
    const fallback = await supabase.from("fundings").select(fullSelectBase).order("display_order");
    data = fallback.data as FundingRow[] | null;
    error = fallback.error;
  }

  if (error || !data?.length) {
    if (error) console.error("Failed to fetch fundings:", error.message);
    return loadImportCache();
  }

  const fundingRows = data as FundingRow[];
  const ids = fundingRows.map((row) => row.funding_id);

  const { data: attachmentData, error: attachmentError } = await supabase
    .from("funding_attachments")
    .select("id, funding_id, file_name, file_type, storage_path, file_order")
    .in("funding_id", ids)
    .order("file_order");

  if (attachmentError) {
    console.error("Failed to fetch funding attachments:", attachmentError.message);
  }

  const attachmentsByFunding = new Map<string, FundingAttachment[]>();
  for (const row of (attachmentData ?? []) as AttachmentRow[]) {
    const list = attachmentsByFunding.get(row.funding_id) ?? [];
    list.push(mapAttachmentRow(row));
    attachmentsByFunding.set(row.funding_id, list);
  }

  const { data: detailImageData, error: detailImageError } = await supabase
    .from("funding_detail_images")
    .select("id, funding_id, storage_path, image_order")
    .in("funding_id", ids)
    .order("image_order");

  if (detailImageError) {
    console.error("Failed to fetch funding detail images:", detailImageError.message);
  }

  const detailImagesByFunding = new Map<string, string[]>();
  for (const row of (detailImageData ?? []) as DetailImageRow[]) {
    const list = detailImagesByFunding.get(row.funding_id) ?? [];
    list.push(mapDetailImageRow(row));
    detailImagesByFunding.set(row.funding_id, list);
  }

  return fundingRows.map((row, index) =>
    mapFundingRow(
      row,
      attachmentsByFunding.get(row.funding_id) ?? [],
      detailImagesByFunding.get(row.funding_id) ?? [],
      ((index % 3) + 1) as 1 | 2 | 3,
    ),
  );
}

async function fetchFundingByIdFromDb(id: string): Promise<FundingItem | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return loadImportCache().find((item) => item.id === id) ?? null;
  }

  const primary = await supabase
    .from("fundings")
    .select(FUNDING_FULL_SELECT_WITH_POSITION)
    .eq("funding_id", id)
    .maybeSingle();
  let data = primary.data as FundingRow | null;
  let error = primary.error;

  if (error && isMissingSchemaError(error.message)) {
    const fallback = await supabase
      .from("fundings")
      .select(FUNDING_FULL_SELECT_BASE)
      .eq("funding_id", id)
      .maybeSingle();
    data = fallback.data as FundingRow | null;
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to fetch funding:", error.message);
    return loadImportCache().find((item) => item.id === id) ?? null;
  }

  if (!data) {
    return loadImportCache().find((item) => item.id === id) ?? null;
  }

  const row = data as FundingRow;

  const { data: attachmentData, error: attachmentError } = await supabase
    .from("funding_attachments")
    .select("id, funding_id, file_name, file_type, storage_path, file_order")
    .eq("funding_id", id)
    .order("file_order");

  if (attachmentError) {
    console.error("Failed to fetch funding attachments:", attachmentError.message);
  }

  const attachments = ((attachmentData ?? []) as AttachmentRow[]).map(mapAttachmentRow);

  const { data: detailImageData, error: detailImageError } = await supabase
    .from("funding_detail_images")
    .select("id, funding_id, storage_path, image_order")
    .eq("funding_id", id)
    .order("image_order");

  if (detailImageError) {
    console.error("Failed to fetch funding detail images:", detailImageError.message);
  }

  const detailImages = ((detailImageData ?? []) as DetailImageRow[]).map(mapDetailImageRow);
  const summaries = await fetchFundingSummariesFromDb();
  const index = summaries.findIndex((item) => item.id === id);
  const imageVariant = ((index >= 0 ? index : 0) % 3 + 1) as 1 | 2 | 3;

  return mapFundingRow(row, attachments, detailImages, imageVariant);
}

const getFundingSummariesCached = unstable_cache(
  fetchFundingSummariesFromDb,
  ["funding-summaries"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["funding-summaries"] },
);

const getFundingsCached = unstable_cache(fetchFundingsFromDb, ["fundings-full"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["fundings-full"],
});

export async function getFundingSummaries(): Promise<FundingListItem[]> {
  return getFundingSummariesCached();
}

export async function getFundings(): Promise<FundingItem[]> {
  return getFundingsCached();
}

export async function getFundingById(id: string): Promise<FundingItem | null> {
  return fetchFundingByIdFromDb(id);
}

export async function getFundingNavigation(id: string): Promise<{
  index: number;
  totalPages: number;
  prevId?: string;
  nextId?: string;
}> {
  const summaries = await getFundingSummaries();
  const index = summaries.findIndex((item) => item.id === id);

  return {
    index,
    totalPages: summaries.length,
    prevId: index > 0 ? summaries[index - 1]?.id : undefined,
    nextId:
      index >= 0 && index < summaries.length - 1 ? summaries[index + 1]?.id : undefined,
  };
}

export async function getFundingIndex(id: string): Promise<number> {
  const summaries = await getFundingSummaries();
  return summaries.findIndex((item) => item.id === id);
}
