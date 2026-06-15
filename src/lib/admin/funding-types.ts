export type AdminFundingAttachment = {
  id: number;
  fileName: string;
  fileType: "pdf" | "doc";
  storagePath: string;
  fileOrder: number;
};

export type AdminFundingRecord = {
  fundingId: string;
  fundingCode: string;
  title: string;
  fullTitle: string;
  organization: string;
  statusLabel: string;
  publishedDate: string;
  openDate: string;
  closeDate: string;
  sourceUrl: string;
  details: string;
  imagePath: string | null;
  displayOrder: number;
  attachments: AdminFundingAttachment[];
};

export type AdminFundingFormInput = {
  title: string;
  fullTitle: string;
  fundingCode: string;
  organization: string;
  statusLabel: string;
  publishedDate: string;
  openDate: string;
  closeDate: string;
  sourceUrl: string;
  details: string;
  displayOrder: number;
};

export type AdminFundingListItem = {
  fundingId: string;
  title: string;
  organization: string;
  statusLabel: string;
  displayOrder: number;
  openDate: string;
  closeDate: string;
};
