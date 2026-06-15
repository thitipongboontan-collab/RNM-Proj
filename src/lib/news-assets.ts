export function resolveNewsImageSrc(imagePath: string | null | undefined): string | undefined {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `/images/news/${imagePath}`;
}

export function resolveNewsAttachmentUrl(storagePath: string | null | undefined): string | undefined {
  if (!storagePath) return undefined;
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  return `/documents/news/${storagePath}`;
}
