import { extractFundingDocumentText } from "@/lib/funding-intelligence/extract-attachment-text";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { isMissingSchemaError } from "@/lib/supabase/schema-fallback";
import path from "node:path";
import { readFile } from "node:fs/promises";

const DOCUMENT_BUCKET = "funding-documents";
const DOCUMENT_PUBLIC_MARKER = `/storage/v1/object/public/${DOCUMENT_BUCKET}/`;

type AttachmentExtractRow = {
  id: number;
  funding_id: string;
  file_name: string;
  storage_path: string;
};

function getAdminClient() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
}

export function fundingDocumentObjectPath(storagePath: string): string | null {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    const index = storagePath.indexOf(DOCUMENT_PUBLIC_MARKER);
    if (index < 0) return null;
    return decodeURIComponent(storagePath.slice(index + DOCUMENT_PUBLIC_MARKER.length));
  }
  return storagePath.replace(/^\/+/, "");
}

async function readAttachmentBytes(storagePath: string): Promise<Buffer> {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    const supabase = getAdminClient();
    const objectPath = fundingDocumentObjectPath(storagePath);
    if (!objectPath) {
      throw new Error("ไม่พบพาธไฟล์ใน Storage");
    }
    const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).download(objectPath);
    if (error || !data) {
      throw new Error(error?.message ?? "ดาวน์โหลดไฟล์แนบไม่สำเร็จ");
    }
    return Buffer.from(await data.arrayBuffer());
  }

  const absolutePath = path.join(process.cwd(), "public", "documents", "funding", storagePath);
  return readFile(absolutePath);
}

async function saveExtraction(
  attachmentId: number,
  extraction: Awaited<ReturnType<typeof extractFundingDocumentText>>,
): Promise<void> {
  const supabase = getAdminClient();
  const payload = {
    extracted_text: extraction.text || null,
    extraction_status: extraction.status,
    text_origin: extraction.textOrigin,
    page_count: extraction.pageCount,
    extracted_at: new Date().toISOString(),
    extraction_error: extraction.errorMessage,
  };

  const { error } = await supabase.from("funding_attachments").update(payload).eq("id", attachmentId);
  if (error && isMissingSchemaError(error.message)) {
    return;
  }
  if (error) {
    throw new Error(error.message);
  }
}

export async function extractAndStoreFundingAttachment(attachmentId: number): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("funding_attachments")
    .select("id, funding_id, file_name, storage_path")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return;

  const row = data as AttachmentExtractRow;
  try {
    const buffer = await readAttachmentBytes(row.storage_path);
    const extraction = await extractFundingDocumentText(buffer, row.file_name);
    await saveExtraction(row.id, extraction);
  } catch (extractError) {
    await saveExtraction(row.id, {
      text: "",
      pageCount: null,
      status: "malformed",
      textOrigin: "none",
      errorMessage:
        extractError instanceof Error ? extractError.message.slice(0, 240) : "อ่านไฟล์แนบไม่สำเร็จ",
    });
  }
}

export async function extractFundingAttachmentsForFunding(fundingId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("funding_attachments")
    .select("id")
    .eq("funding_id", fundingId)
    .order("file_order");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ id: number }>;
  for (const row of rows) {
    await extractAndStoreFundingAttachment(row.id);
  }
  return rows.length;
}

export async function extractPendingFundingAttachments(limit = 20): Promise<number> {
  const supabase = getAdminClient();
  let query = supabase
    .from("funding_attachments")
    .select("id")
    .in("extraction_status", ["pending"])
    .order("id")
    .limit(limit);

  let { data, error } = await query;
  if (error && isMissingSchemaError(error.message)) {
    ({ data, error } = await supabase.from("funding_attachments").select("id").order("id").limit(limit));
  }
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ id: number }>;
  for (const row of rows) {
    await extractAndStoreFundingAttachment(row.id);
  }
  return rows.length;
}

export async function extractTextFromUploadFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractFundingDocumentText(buffer, file.name);
}
