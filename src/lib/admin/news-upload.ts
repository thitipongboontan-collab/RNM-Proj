import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { imageStoragePathBelongsToOwner } from "@/lib/admin/storage-image-path";

const IMAGE_BUCKET = "research-news-images";
const DOCUMENT_BUCKET = "research-news-documents";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).replace(".", "").toLowerCase();
  return ext || "bin";
}

async function uploadToSupabaseStorage(
  bucket: string,
  objectPath: string,
  file: File,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucket).upload(objectPath, buffer, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function writeLocalPublicFile(relativePath: string, file: File): Promise<void> {
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
}

export async function uploadNewsImage(newsId: string, file: File): Promise<string> {
  const extension = getFileExtension(file.name);
  const objectPath = `${newsId}/cover-${Date.now()}.${extension}`;

  const storageUrl = await uploadToSupabaseStorage(IMAGE_BUCKET, objectPath, file);
  if (storageUrl) return storageUrl;

  await writeLocalPublicFile(`images/news/${objectPath}`, file);
  return objectPath;
}

export async function removeNewsImage(
  imagePath: string | null,
  ownerId?: string,
): Promise<void> {
  if (!imagePath) return;
  if (ownerId && !imageStoragePathBelongsToOwner(ownerId, imagePath)) return;

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
    await unlink(path.join(process.cwd(), "public", "images", "news", imagePath));
  } catch {
    // Ignore missing local files.
  }
}

export async function uploadNewsAttachment(
  newsId: string,
  file: File,
): Promise<{ fileName: string; storagePath: string }> {
  const safeName = sanitizeFileName(file.name);
  const objectPath = `${newsId}/${safeName}`;

  const storageUrl = await uploadToSupabaseStorage(DOCUMENT_BUCKET, objectPath, file);
  if (storageUrl) {
    return { fileName: safeName, storagePath: storageUrl };
  }

  await writeLocalPublicFile(`documents/news/${objectPath}`, file);
  return { fileName: safeName, storagePath: objectPath };
}

export async function removeNewsAttachment(storagePath: string | null): Promise<void> {
  if (!storagePath) return;

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    const admin = createSupabaseAdminClient();
    if (!admin) return;
    const marker = `/storage/v1/object/public/${DOCUMENT_BUCKET}/`;
    const index = storagePath.indexOf(marker);
    if (index >= 0) {
      const objectPath = storagePath.slice(index + marker.length);
      await admin.storage.from(DOCUMENT_BUCKET).remove([objectPath]);
    }
    return;
  }

  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(process.cwd(), "public", "documents", "news", storagePath));
  } catch {
    // Ignore missing local files.
  }
}
