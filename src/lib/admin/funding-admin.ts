import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type {
  AdminFundingFormInput,
  AdminFundingListItem,
  AdminFundingRecord,
} from "@/lib/admin/funding-types";
import {
  buildFundingDetailImageObjectPath,
  buildFundingDocumentObjectPath,
  removeFundingDocument,
  removeFundingImage,
  resolveFundingDocumentFileType,
  sanitizeFundingFileName,
  uploadFundingDocument,
  uploadFundingImage,
} from "@/lib/admin/funding-upload";
import { normalizeImagePosition } from "@/lib/image-position";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";

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

type DetailImageRow = {
  id: number;
  funding_id: string;
  storage_path: string;
  image_order: number | null;
};

function mapFundingRecord(
  row: FundingRow,
  attachments: AttachmentRow[],
  detailImages: DetailImageRow[],
): AdminFundingRecord {
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
    imagePosition: normalizeImagePosition(row.image_position),
    displayOrder: row.display_order ?? 0,
    attachments: attachments.map((item) => ({
      id: item.id,
      fileName: item.file_name,
      fileType: item.file_type,
      storagePath: item.storage_path,
      fileOrder: item.file_order ?? 0,
    })),
    detailImages: detailImages.map((item) => ({
      id: item.id,
      storagePath: item.storage_path,
      imageOrder: item.image_order ?? 0,
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
  const selectWithPosition =
    "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, image_position, display_order";
  const selectBase =
    "funding_id, funding_code, title, full_title, organization, status_label, published_date, open_date, close_date, source_url, details, image_path, display_order";

  let { data, error } = await supabase
    .from("fundings")
    .select(selectWithPosition)
    .eq("funding_id", id)
    .maybeSingle();

  if (error && isMissingSchemaError(error.message)) {
    ({ data, error } = await supabase
      .from("fundings")
      .select(selectBase)
      .eq("funding_id", id)
      .maybeSingle());
  }

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

  const { data: detailImages, error: detailImageError } = await supabase
    .from("funding_detail_images")
    .select("id, funding_id, storage_path, image_order")
    .eq("funding_id", id)
    .order("image_order");

  if (detailImageError && !isMissingSchemaError(detailImageError.message)) {
    throw new Error(detailImageError.message);
  }

  return mapFundingRecord(
    data as FundingRow,
    (attachments ?? []) as AttachmentRow[],
    (detailImageError ? [] : (detailImages ?? [])) as DetailImageRow[],
  );
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

export type PreparedFundingDocumentUpload = {
  signedUrl: string;
  token: string;
  objectPath: string;
  storagePath: string;
  fileName: string;
  fileType: "pdf" | "doc";
  fileOrder: number;
};

export async function prepareFundingDocumentUpload(
  fundingId: string,
  fileName: string,
  fileOrder: number,
): Promise<PreparedFundingDocumentUpload> {
  const supabase = getAdminClient();
  const safeName = sanitizeFundingFileName(fileName);
  const fileType = resolveFundingDocumentFileType(safeName);
  const objectPath = buildFundingDocumentObjectPath(fundingId, fileName, fileOrder);

  const { data, error } = await supabase.storage
    .from("funding-documents")
    .createSignedUploadUrl(objectPath);

  if (error || !data) {
    throw new Error(error?.message ?? "ไม่สามารถเตรียมอัปโหลดไฟล์ได้");
  }

  const { data: publicUrl } = supabase.storage.from("funding-documents").getPublicUrl(objectPath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    objectPath,
    storagePath: publicUrl.publicUrl,
    fileName: safeName,
    fileType,
    fileOrder,
  };
}

export async function registerFundingDocumentAttachment(
  fundingId: string,
  attachment: Pick<PreparedFundingDocumentUpload, "storagePath" | "fileName" | "fileType" | "fileOrder">,
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("funding_attachments").insert({
    funding_id: fundingId,
    file_name: attachment.fileName,
    file_type: attachment.fileType,
    storage_path: attachment.storagePath,
    file_order: attachment.fileOrder,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export type PreparedFundingDetailImageUpload = {
  signedUrl: string;
  token: string;
  objectPath: string;
  storagePath: string;
  imageOrder: number;
};

export async function prepareFundingDetailImageUpload(
  fundingId: string,
  fileName: string,
  imageOrder: number,
): Promise<PreparedFundingDetailImageUpload> {
  const supabase = getAdminClient();
  const objectPath = buildFundingDetailImageObjectPath(fundingId, fileName, imageOrder);

  const { data, error } = await supabase.storage
    .from("funding-images")
    .createSignedUploadUrl(objectPath);

  if (error || !data) {
    throw new Error(error?.message ?? "ไม่สามารถเตรียมอัปโหลดรูปภาพได้");
  }

  const { data: publicUrl } = supabase.storage.from("funding-images").getPublicUrl(objectPath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    objectPath,
    storagePath: publicUrl.publicUrl,
    imageOrder,
  };
}

export async function registerFundingDetailImage(
  fundingId: string,
  image: Pick<PreparedFundingDetailImageUpload, "storagePath" | "imageOrder">,
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("funding_detail_images").insert({
    funding_id: fundingId,
    storage_path: image.storagePath,
    image_order: image.imageOrder,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAdminFundingDetailImage(
  fundingId: string,
  imageId: number,
): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("funding_detail_images")
    .select("id, funding_id, storage_path")
    .eq("id", imageId)
    .eq("funding_id", fundingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return;

  await removeFundingImage(data.storage_path);

  const { error: deleteError } = await supabase
    .from("funding_detail_images")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    throw new Error(deleteError.message);
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

  const insertPayload = {
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
    image_position: normalizeImagePosition(input.imagePosition),
    display_order: 1,
  };

  let { error } = await supabase.from("fundings").insert(insertPayload);
  if (error && isMissingSchemaError(error.message)) {
    const { image_position: _imagePosition, ...withoutPosition } = insertPayload;
    ({ error } = await supabase.from("fundings").insert(withoutPosition));
  }

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
    await removeFundingImage(imagePath, fundingId);
    imagePath = null;
  }
  if (imageFile && imageFile.size > 0) {
    if (imagePath) {
      await removeFundingImage(imagePath, fundingId);
    }
    imagePath = await uploadFundingImage(fundingId, imageFile);
  }

  const updatePayload = {
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
    image_position: normalizeImagePosition(input.imagePosition),
    display_order: input.displayOrder,
  };

  let { error } = await supabase
    .from("fundings")
    .update(updatePayload)
    .eq("funding_id", fundingId);

  if (error && isMissingSchemaError(error.message)) {
    const { image_position: _imagePosition, ...withoutPosition } = updatePayload;
    ({ error } = await supabase
      .from("fundings")
      .update(withoutPosition)
      .eq("funding_id", fundingId));
  }

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
    await removeFundingImage(existing.imagePath, fundingId);
  }

  for (const attachment of existing.attachments) {
    await removeFundingDocument(attachment.storagePath);
  }

  for (const image of existing.detailImages) {
    await removeFundingImage(image.storagePath);
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
