export type AdminFundingAttachment = {
  id: number;
  fileName: string;
  fileType: "pdf" | "doc";
  storagePath: string;
  fileOrder: number;
};

export type AdminFundingDetailImage = {
  id: number;
  storagePath: string;
  imageOrder: number;
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
  imagePosition: string;
  displayOrder: number;
  attachments: AdminFundingAttachment[];
  detailImages: AdminFundingDetailImage[];
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
  imagePosition: string;
};

export type AdminFundingListItem = {
  fundingId: string;
  title: string;
  organization: string;
  statusLabel: string;
  displayOrder: number;
  openDate: string;
  closeDate: string;
  viewCount: number;
};
