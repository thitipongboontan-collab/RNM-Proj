export type AssistantAttachmentPayload = {
  name: string;
  mimeType: string;
  kind: "image" | "text" | "document";
  data: string;
};

export type PendingAttachment = AssistantAttachmentPayload & {
  id: string;
  previewUrl?: string;
};

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const TEXT_MAX_BYTES = 200 * 1024;
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const TEXT_MAX_CHARS = 8000;

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
]);

const TEXT_EXTENSIONS = [".txt", ".csv", ".md", ".json", ".sql"];

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isDocumentFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    lower.endsWith(".pdf") ||
    file.type === DOCX_MIME ||
    lower.endsWith(".docx") ||
    file.type === "application/msword" ||
    lower.endsWith(".doc")
  );
}

function documentMimeType(file: File) {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) return DOCX_MIME;
  if (lower.endsWith(".doc")) return "application/msword";
  return "application/octet-stream";
}

function attachmentKindLabel(name: string, kind: PendingAttachment["kind"]) {
  if (kind === "image") return "IMG";
  if (kind === "document") {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "DOC";
    return "FILE";
  }
  return "TXT";
}

export { attachmentKindLabel };

function isTextFile(file: File) {
  if (TEXT_MIME_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function readFileAsBase64(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const base64 = dataUrl.split(",")[1] ?? "";
  if (!base64) throw new Error(`Could not read ${file.name}`);
  return base64;
}

export async function parseAssistantAttachment(file: File): Promise<PendingAttachment> {
  if (file.type.startsWith("image/")) {
    if (file.size > IMAGE_MAX_BYTES) {
      throw new Error(`${file.name} is larger than 5 MB`);
    }

    const dataUrl = await readFileAsDataUrl(file);
    const base64 = dataUrl.split(",")[1] ?? "";
    if (!base64) throw new Error(`Could not read ${file.name}`);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type || "image/jpeg",
      kind: "image",
      data: base64,
      previewUrl: dataUrl,
    };
  }

  if (isDocumentFile(file)) {
    if (file.size > DOCUMENT_MAX_BYTES) {
      throw new Error(`${file.name} is larger than 10 MB`);
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: documentMimeType(file),
      kind: "document",
      data: await readFileAsBase64(file),
    };
  }

  if (isTextFile(file)) {
    if (file.size > TEXT_MAX_BYTES) {
      throw new Error(`${file.name} is larger than 200 KB`);
    }

    const text = (await file.text()).slice(0, TEXT_MAX_CHARS);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type || "text/plain",
      kind: "text",
      data: text,
    };
  }

  throw new Error(
    "Supported files: images, PDF, Word (.doc/.docx), and text (.txt, .csv, .md, .json)",
  );
}

export function buildAttachmentContext(attachments: AssistantAttachmentPayload[]): string {
  const textBlocks = attachments
    .filter((item) => item.kind === "text" && item.data.trim())
    .map((item) => `=== ไฟล์แนบ: ${item.name} ===\n${item.data.trim()}`);

  if (!textBlocks.length) return "";
  return `\n\n${textBlocks.join("\n\n")}`;
}

export type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

export function buildOpenAIUserContent(
  message: string,
  attachments: AssistantAttachmentPayload[],
): string | OpenAIContentPart[] {
  const textContext = buildAttachmentContext(attachments);
  const userText = [message.trim(), textContext.trim()].filter(Boolean).join("\n\n");

  const imageParts = attachments
    .filter((item) => item.kind === "image")
    .map(
      (item): OpenAIContentPart => ({
        type: "image_url",
        image_url: {
          url: `data:${item.mimeType};base64,${item.data}`,
          detail: "auto",
        },
      }),
    );

  if (!imageParts.length) {
    return userText || message;
  }

  const parts: OpenAIContentPart[] = [];
  if (userText) {
    parts.push({ type: "text", text: userText });
  } else {
    parts.push({
      type: "text",
      text: "ผู้ใช้แนบรูปภาพมา โปรดวิเคราะห์รูปและตอบเป็นภาษาไทย โดยอ้างอิงข้อมูลจากฐานข้อมูลแพลตฟอร์มด้วยถ้าเกี่ยวข้อง",
    });
  }

  return [...parts, ...imageParts];
}
