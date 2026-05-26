export type FundingAttachment = {
  id: string;
  fileName: string;
  type: "doc" | "pdf";
  downloadUrl: string;
};

export type FundingDetailContent = {
  fullTitle: string;
  organization: string;
  publishedDate: string;
  bodySections: string[];
  bulletGroups?: { title?: string; items: string[] }[];
  numberedList?: { title: string; items: string[] };
  closingNote?: string;
  downloadLabel: string;
  attachments: FundingAttachment[];
  nriisUrl: string;
  nrctUrl: string;
};

export type FundingItem = {
  id: string;
  title: string;
  organization: string;
  openDate: string;
  closeDate: string;
  publishedDate: string;
  imageVariant: 1 | 2 | 3;
  imageSrc?: string;
  statusLabel: string;
  detail: FundingDetailContent;
};

export const HERO_GRADIENT: Record<FundingItem["imageVariant"], string> = {
  1: "linear-gradient(135deg, #4D5CAD 0%, #6B8FD4 100%)",
  2: "linear-gradient(135deg, #12B2C5 0%, #4D5CAD 100%)",
  3: "linear-gradient(135deg, #00CACC 0%, #4765B0 100%)",
};
