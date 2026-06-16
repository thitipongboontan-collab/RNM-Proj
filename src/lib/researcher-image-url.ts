export function resolveResearcherImageUrl(
  _researcherId: string,
  imagePath?: string | null,
): string | undefined {
  if (!imagePath) return undefined;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return `/images/researchers/${imagePath}`;
}
