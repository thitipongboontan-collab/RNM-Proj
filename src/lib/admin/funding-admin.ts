import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type {
  AdminFundingFormInput,
  AdminFundingListItem,
  AdminFundingRecord,
} from "@/lib/admin/funding-types";
import {
  removeFundingDocument,
  removeFundingImage,
  uploadFundingDocument,
  uploadFundingImage,
} from "@/lib/admin/funding-upload";

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
  view_count: number | null;
};

type AttachmentRow = {
  id: number;
  funding_id: string;
  file_name: string;
  file_type: "pdf" | "doc";
  storage_path: string;
  file_order: number | null;
};

function getAdminClient() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
}

function mapFundingRecord(row: FundingRow, attachments: AttachmentRow[]): AdminFundingRecord {
  return {
    fundingId: row.funding_id,
    fundingCode: row.funding_code,
    title: row.title,
    fullTitle: row.full_title,
    organization: row.organization,
    statusLabel: row.status_label,
    publishedDate: row.published_date,
    openDate: row.open_date,
    closeDate: row.close_date,
    sourceUrl: row.source_url ?? "",
    details: row.details,
    imagePath: row.image_path,
    displayOrder: row.display_order ?? 0,
    attachments: attachments.map((item) => ({
      id: item.id,
      fileName: item.file_name,
      fileType: item.file_type,
      storagePath: item.storage_path,
      fileOrder: item.file_order ?? 0,
    })),
  };
}

export async function listAdminFundings(): Promise<AdminFundingListItem[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("fundings")
    .select("funding_id, title, organization, status_label, display_order, open_date, close_date, view_count")
    .order("display_order");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as FundingRow[]).map((row) => ({
    fundingId: row.funding_id,
    title: row.title,
    organization: row.organization,
    statusLabel: row.status_label,
    displayOrder: row.display_order ?? 0,
    openDate: row.open_date,
    closeDate: row.close_date,
    viewCount: row.view_count ?? 0,
  }));
}

export async function getAdminFundingById(id: string): Promise<AdminFundingRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("fundings")
    .select(
      "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, display_order",
    )
    .eq("funding_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const { data: attachments, error: attachmentError } = await supabase
    .from("funding_attachments")
    .select("id, funding_id, file_name, file_type, storage_path, file_order")
    .eq("funding_id", id)
    .order("file_order");

  if (attachmentError) {
    throw new Error(attachmentError.message);
  }

  return mapFundingRecord(data as FundingRow, (attachments ?? []) as AttachmentRow[]);
}

async function generateNextFundingId(): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("fundings")
    .select("funding_id")
    .order("funding_id", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const lastId = data?.[0]?.funding_id ?? "FD000";
  const numeric = Number.parseInt(String(lastId).replace(/^FD/i, ""), 10);
  const next = Number.isFinite(numeric) ? numeric + 1 : 1;
  return `FD${String(next).padStart(3, "0")}`;
}

async function generateNextFundingCode(): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("fundings")
    .select("funding_code")
    .order("funding_code", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const lastCode = data?.[0]?.funding_code ?? "FUND0000";
  const numeric = Number.parseInt(String(lastCode).replace(/^FUND/i, ""), 10);
  const next = Number.isFinite(numeric) ? numeric + 1 : 1;
  return `FUND${String(next).padStart(4, "0")}`;
}

async function shiftExistingFundingsForNewItem(): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("fundings").select("funding_id, display_order");

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.length) return;

  const updates = await Promise.all(
    data.map((row) =>
      supabase
        .from("fundings")
        .update({ display_order: (row.display_order ?? 0) + 1 })
        .eq("funding_id", row.funding_id),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

async function insertAttachments(
  fundingId: string,
  files: File[],
  startOrder: number,
): Promise<void> {
  if (!files.length) return;

  const supabase = getAdminClient();
  const rows = [];

  for (const [index, file] of files.entries()) {
    const uploaded = await uploadFundingDocument(fundingId, file, startOrder + index + 1);
    rows.push({
      funding_id: fundingId,
      file_name: uploaded.fileName,
      file_type: uploaded.fileType,
      storage_path: uploaded.storagePath,
      file_order: startOrder + index + 1,
    });
  }

  const { error } = await supabase.from("funding_attachments").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function createAdminFunding(
  input: AdminFundingFormInput,
  imageFile: File | null,
  attachmentFiles: File[],
): Promise<string> {
  const supabase = getAdminClient();
  const fundingId = await generateNextFundingId();
  const fundingCode = input.fundingCode.trim() || (await generateNextFundingCode());

  await shiftExistingFundingsForNewItem();

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadFundingImage(fundingId, imageFile);
  }

  const { error } = await supabase.from("fundings").insert({
    funding_id: fundingId,
    funding_code: fundingCode,
    title: input.title.trim(),
    full_title: input.fullTitle.trim() || input.title.trim(),
    organization: input.organization.trim(),
    status_label: input.statusLabel.trim() || "ทุนวิจัยที่เปิดรับ",
    published_date: input.publishedDate.trim(),
    open_date: input.openDate.trim(),
    close_date: input.closeDate.trim(),
    source_url: input.sourceUrl.trim() || null,
    details: input.details.trim(),
    image_path: imagePath,
    display_order: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  await insertAttachments(fundingId, attachmentFiles, 0);
  return fundingId;
}

export async function updateAdminFunding(
  fundingId: string,
  input: AdminFundingFormInput,
  imageFile: File | null,
  attachmentFiles: File[],
  removeImage: boolean,
): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminFundingById(fundingId);
  if (!existing) {
    throw new Error("Funding not found.");
  }

  let imagePath = existing.imagePath;
  if (removeImage && imagePath) {
    await removeFundingImage(imagePath);
    imagePath = null;
  }
  if (imageFile && imageFile.size > 0) {
    if (imagePath) {
      await removeFundingImage(imagePath);
    }
    imagePath = await uploadFundingImage(fundingId, imageFile);
  }

  const { error } = await supabase
    .from("fundings")
    .update({
      funding_code: input.fundingCode.trim(),
      title: input.title.trim(),
      full_title: input.fullTitle.trim() || input.title.trim(),
      organization: input.organization.trim(),
      status_label: input.statusLabel.trim() || "ทุนวิจัยที่เปิดรับ",
      published_date: input.publishedDate.trim(),
      open_date: input.openDate.trim(),
      close_date: input.closeDate.trim(),
      source_url: input.sourceUrl.trim() || null,
      details: input.details.trim(),
      image_path: imagePath,
      display_order: input.displayOrder,
    })
    .eq("funding_id", fundingId);

  if (error) {
    throw new Error(error.message);
  }

  const startOrder = existing.attachments.reduce(
    (max, item) => Math.max(max, item.fileOrder),
    0,
  );
  await insertAttachments(fundingId, attachmentFiles, startOrder);
}

export async function deleteAdminFundingAttachment(
  fundingId: string,
  attachmentId: number,
): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("funding_attachments")
    .select("id, funding_id, storage_path")
    .eq("id", attachmentId)
    .eq("funding_id", fundingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return;

  await removeFundingDocument(data.storage_path);

  const { error: deleteError } = await supabase
    .from("funding_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

export async function deleteAdminFunding(fundingId: string): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getAdminFundingById(fundingId);
  if (!existing) return;

  if (existing.imagePath) {
    await removeFundingImage(existing.imagePath);
  }

  for (const attachment of existing.attachments) {
    await removeFundingDocument(attachment.storagePath);
  }

  const { error } = await supabase.from("fundings").delete().eq("funding_id", fundingId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSuggestedFundingDefaults(): Promise<{
  fundingCode: string;
  displayOrder: number;
}> {
  const fundingCode = await generateNextFundingCode();
  return { fundingCode, displayOrder: 1 };
}
