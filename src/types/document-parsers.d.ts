declare module "pdf-parse" {
  type PdfParseResult = {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  };

  type PdfPageData = {
    getTextContent: (options?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }) => Promise<{
      items: Array<{ str?: string; transform?: number[] }>;
    }>;
  };

  type PdfParseOptions = {
    pagerender?: (pageData: PdfPageData) => Promise<string>;
  };

  export default function pdfParse(data: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
}

declare module "word-extractor" {
  type ExtractedDocument = {
    getBody(): string;
  };

  export default class WordExtractor {
    extract(input: Buffer): Promise<ExtractedDocument>;
  }
}
