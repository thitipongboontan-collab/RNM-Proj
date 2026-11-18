export const FUNDING_DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const FUNDING_EXTRACTED_TEXT_MAX_CHARS = 60000;
const MIN_LETTERS_PER_PAGE = 12;
const MIN_TOTAL_LETTERS = 40;

export type FundingExtractionStatus =
  | "extracted"
  | "needs_ocr"
  | "malformed"
  | "too_large"
  | "unsupported";

export type FundingDocumentExtraction = {
  text: string;
  pageCount: number | null;
  status: FundingExtractionStatus;
  textOrigin: "embedded" | "none";
  errorMessage: string | null;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
};

function countLetters(text: string): number {
  return (text.match(/[A-Za-z\u0E00-\u0E7F]/g) ?? []).length;
}

export function classifyExtractedText(
  text: string,
  pageCount: number | null,
): Pick<FundingDocumentExtraction, "status" | "textOrigin"> {
  const letters = countLetters(text);
  const pages = pageCount && pageCount > 0 ? pageCount : 1;
  if (letters < MIN_TOTAL_LETTERS || letters / pages < MIN_LETTERS_PER_PAGE) {
    return { status: "needs_ocr", textOrigin: "none" };
  }
  return { status: "extracted", textOrigin: "embedded" };
}

export function normalizeExtractedDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, FUNDING_EXTRACTED_TEXT_MAX_CHARS);
}

function fileKind(fileName: string): "pdf" | "docx" | "doc" | "unsupported" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  return "unsupported";
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const pdfParse = (await import("pdf-parse")).default;
  let pageNumber = 0;
  const result = await pdfParse(buffer, {
    pagerender: async (pageData) => {
      pageNumber += 1;
      const content = await pageData.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      let lastY: number | undefined;
      let pageText = "";
      for (const item of content.items as PdfTextItem[]) {
        const y = item.transform?.[5];
        if (lastY === undefined || y === lastY) {
          pageText += item.str ?? "";
        } else {
          pageText += `\n${item.str ?? ""}`;
        }
        lastY = y;
      }
      return `\n[[page ${pageNumber}]]\n${pageText}`;
    },
  });

  return {
    text: result.text ?? "",
    pageCount: result.numpages ?? pageNumber,
  };
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractDocText(buffer: Buffer): Promise<string> {
  const WordExtractor = (await import("word-extractor")).default;
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody();
}

export async function extractFundingDocumentText(
  buffer: Buffer,
  fileName: string,
): Promise<FundingDocumentExtraction> {
  if (buffer.byteLength > FUNDING_DOCUMENT_MAX_BYTES) {
    return {
      text: "",
      pageCount: null,
      status: "too_large",
      textOrigin: "none",
      errorMessage: `ไฟล์ใหญ่เกิน ${FUNDING_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB`,
    };
  }

  const kind = fileKind(fileName);
  if (kind === "unsupported") {
    return {
      text: "",
      pageCount: null,
      status: "unsupported",
      textOrigin: "none",
      errorMessage: `ไม่รองรับชนิดไฟล์ ${fileName}`,
    };
  }

  try {
    let raw = "";
    let pageCount: number | null = null;

    if (kind === "pdf") {
      const extracted = await extractPdfText(buffer);
      raw = extracted.text;
      pageCount = extracted.pageCount;
    } else if (kind === "docx") {
      raw = await extractDocxText(buffer);
      pageCount = 1;
    } else {
      raw = await extractDocText(buffer);
      pageCount = 1;
    }

    const text = normalizeExtractedDocumentText(raw);
    const classified = classifyExtractedText(text, pageCount);
    return {
      text,
      pageCount,
      status: classified.status,
      textOrigin: classified.textOrigin,
      errorMessage:
        classified.status === "needs_ocr"
          ? "ไฟล์มีข้อความน้อยหรือเป็นสแกน ยังไม่ได้ทำ OCR"
          : null,
    };
  } catch (error) {
    return {
      text: "",
      pageCount: null,
      status: "malformed",
      textOrigin: "none",
      errorMessage: error instanceof Error ? error.message.slice(0, 240) : "อ่านไฟล์ไม่สำเร็จ",
    };
  }
}
