import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

const IMAGE_BUCKET = "researcher-images";

function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).replace(".", "").toLowerCase();
  return ext || "bin";
}

async function uploadToSupabaseStorage(objectPath: string, file: File): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(IMAGE_BUCKET).upload(objectPath, buffer, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function writeLocalPublicFile(relativePath: string, file: File): Promise<void> {
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
}

export async function uploadResearcherImage(researcherId: string, file: File): Promise<string> {
  const extension = getFileExtension(file.name);
  const objectPath = `${researcherId}.${extension}`;

  const storageUrl = await uploadToSupabaseStorage(objectPath, file);
  if (storageUrl) return storageUrl;

  await writeLocalPublicFile(`images/researchers/${objectPath}`, file);
  return objectPath;
}

export async function removeResearcherImage(imagePath: string | null): Promise<void> {
  if (!imagePath) return;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    const admin = createSupabaseAdminClient();
    if (!admin) return;
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const index = imagePath.indexOf(marker);
    if (index >= 0) {
      const objectPath = imagePath.slice(index + marker.length);
      await admin.storage.from(IMAGE_BUCKET).remove([objectPath]);
    }
    return;
  }

  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(process.cwd(), "public", "images", "researchers", imagePath));
  } catch {
    // Ignore missing local files.
  }
}
