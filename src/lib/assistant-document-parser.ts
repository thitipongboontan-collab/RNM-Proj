import type { AssistantAttachmentPayload } from "@/lib/assistant-attachments";

const DOCUMENT_TEXT_MAX_CHARS = 12000;

function decodeBase64(data: string): Buffer {
  return Buffer.from(data, "base64");
}

function isPdfAttachment(attachment: AssistantAttachmentPayload) {
  const lower = attachment.name.toLowerCase();
  return attachment.mimeType === "application/pdf" || lower.endsWith(".pdf");
}

function isDocxAttachment(attachment: AssistantAttachmentPayload) {
  const lower = attachment.name.toLowerCase();
  return (
    lower.endsWith(".docx") ||
    attachment.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function isDocAttachment(attachment: AssistantAttachmentPayload) {
  const lower = attachment.name.toLowerCase();
  return attachment.mimeType === "application/msword" || lower.endsWith(".doc");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractDocText(buffer: Buffer): Promise<string> {
  const WordExtractor = (await import("word-extractor")).default;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody();
}

export async function extractDocumentText(
  attachment: AssistantAttachmentPayload,
): Promise<string> {
  const buffer = decodeBase64(attachment.data);
  let text = "";

  if (isPdfAttachment(attachment)) {
    text = await extractPdfText(buffer);
  } else if (isDocxAttachment(attachment)) {
    text = await extractDocxText(buffer);
  } else if (isDocAttachment(attachment)) {
    text = await extractDocText(buffer);
  } else {
    throw new Error(`Unsupported document type: ${attachment.name}`);
  }

  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, DOCUMENT_TEXT_MAX_CHARS);
  if (!trimmed) {
    throw new Error(
      `Could not extract text from ${attachment.name}. The file may be empty or image-only.`,
    );
  }

  return trimmed;
}

export async function resolveAttachmentsForAssistant(
  attachments: AssistantAttachmentPayload[],
): Promise<AssistantAttachmentPayload[]> {
  const resolved: AssistantAttachmentPayload[] = [];

  for (const attachment of attachments) {
    if (attachment.kind !== "document") {
      resolved.push(attachment);
      continue;
    }

    const text = await extractDocumentText(attachment);
    resolved.push({
      name: attachment.name,
      mimeType: attachment.mimeType,
      kind: "text",
      data: text,
    });
  }

  return resolved;
}
