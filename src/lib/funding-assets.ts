export function resolveFundingImageSrc(imagePath: string | null | undefined): string | undefined {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `/images/funding/${imagePath}`;
}

export function resolveFundingDocumentUrl(storagePath: string): string {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  return `/documents/funding/${storagePath}`;
}
