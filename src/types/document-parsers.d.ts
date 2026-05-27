declare module "pdf-parse" {
  type PdfParseResult = {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  };

  export default function pdfParse(data: Buffer): Promise<PdfParseResult>;
}

declare module "word-extractor" {
  type ExtractedDocument = {
    getBody(): string;
  };

  export default class WordExtractor {
    extract(input: Buffer): Promise<ExtractedDocument>;
  }
}
