import fundingImportData from "@/data/funding-import.json";
import type {
  FundingAttachment,
  FundingDetailContent,
  FundingItem,
} from "@/data/funding";
import { parseFundingDetails } from "@/lib/funding-content";
import { createSupabaseClient } from "@/lib/supabase/client";
import { abbreviateThaiMonthsInText } from "@/lib/thai-date";

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
): FundingDetailContent {
  const parsed = parseFundingDetails(row.details, row.source_url ?? undefined);

  return {
    fullTitle: row.full_title,
    organization: row.organization,
    publishedDate: row.published_date,
    downloadLabel: "ดาวน์โหลดไฟล์ที่เกี่ยวข้อง",
    attachments,
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

function mapAttachmentRow(row: AttachmentRow): FundingAttachment {
  return {
    id: String(row.id),
    fileName: row.file_name,
    type: row.file_type,
    downloadUrl: `/documents/funding/${row.storage_path}`,
  };
}

function mapFundingRow(
  row: FundingRow,
  attachments: FundingAttachment[],
  imageVariant: 1 | 2 | 3,
): FundingItem {
  return {
    id: row.funding_id,
    title: row.title,
    organization: row.organization,
    openDate: formatOpenDate(row.open_date),
    closeDate: formatCloseDate(row.close_date),
    publishedDate: row.published_date,
    imageVariant,
    imageSrc: row.image_path ? `/images/funding/${row.image_path}` : undefined,
    statusLabel: row.status_label,
    detail: buildDetail(row, attachments),
  };
}

function loadImportCache(): FundingItem[] {
  return (fundingImportData as FundingImportRecord[]).map(mapImportRecord);
}

export async function getFundings(): Promise<FundingItem[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return loadImportCache();

  const { data, error } = await supabase
    .from("fundings")
    .select(
      "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, display_order",
    )
    .order("display_order");

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

  return fundingRows.map((row, index) =>
    mapFundingRow(
      row,
      attachmentsByFunding.get(row.funding_id) ?? [],
      ((index % 3) + 1) as 1 | 2 | 3,
    ),
  );
}

export async function getFundingById(id: string): Promise<FundingItem | null> {
  const items = await getFundings();
  return items.find((item) => item.id === id) ?? null;
}

export async function getFundingIndex(id: string): Promise<number> {
  const items = await getFundings();
  return items.findIndex((item) => item.id === id);
}
