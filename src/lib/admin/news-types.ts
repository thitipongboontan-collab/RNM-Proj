export type AdminNewsRecord = {
  newsId: string;
  title: string;
  category: string;
  publishedDate: string;
  details: string;
  externalUrl: string;
  imagePath: string | null;
  attachmentFileName: string | null;
  attachmentStoragePath: string | null;
  viewCount: number;
  displayOrder: number;
};

export type AdminNewsFormInput = {
  title: string;
  category: string;
  publishedDate: string;
  details: string;
  externalUrl: string;
  displayOrder?: number;
};

export type AdminNewsListItem = {
  newsId: string;
  title: string;
  category: string;
  publishedDate: string;
  viewCount: number;
  displayOrder: number;
};
