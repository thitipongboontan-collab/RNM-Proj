import fs from "fs";
import path from "path";
import { resolveResearcherImageUrl } from "@/lib/researcher-image-url";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

export function resolveResearcherImageSrc(
  researcherId: string,
  imagePath?: string | null,
): string | undefined {
  const fromPath = resolveResearcherImageUrl(researcherId, imagePath);
  if (fromPath) return fromPath;

  const imageDir = path.join(process.cwd(), "public", "images", "researchers");

  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(imageDir, `${researcherId}${ext}`);
    if (fs.existsSync(filePath)) {
      return `/images/researchers/${researcherId}${ext}`;
    }
  }

  return undefined;
}
