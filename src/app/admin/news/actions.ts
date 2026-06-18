"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  createAdminNews,
  deleteAdminNews,
  updateAdminNews,
} from "@/lib/admin/news-admin";
import type { AdminNewsFormInput } from "@/lib/admin/news-types";
import { revalidateNewsCaches } from "@/lib/admin/revalidate";
import { normalizeImagePosition } from "@/lib/image-position";
import { parseThaiEventDateText } from "@/lib/thai-date";

export type NewsActionState = {
  error?: string;
  success?: string;
};

function readCategory(formData: FormData): string {
  const custom = String(formData.get("customCategory") ?? "").trim();
  if (custom) return custom;

  const preset = String(formData.get("categoryPreset") ?? "").trim();
  if (preset && preset !== "__custom__") return preset;

  return "";
}

function readNewsInput(formData: FormData): AdminNewsFormInput {
  return {
    title: String(formData.get("title") ?? ""),
    category: readCategory(formData),
    publishedDate: String(formData.get("publishedDate") ?? ""),
    details: String(formData.get("details") ?? ""),
    externalUrl: String(formData.get("externalUrl") ?? ""),
    displayOrder: Number.parseInt(String(formData.get("displayOrder") ?? "0"), 10) || 0,
    imagePosition: normalizeImagePosition(String(formData.get("imagePosition") ?? "")),
  };
}

function validateNewsInput(input: AdminNewsFormInput): string | null {
  if (!input.title.trim()) return "กรุณากรอกชื่อข่าว";
  if (!input.category.trim()) return "กรุณาเลือกหรือระบุหมวดหมู่";
  if (!input.publishedDate.trim()) return "กรุณาเลือกวันที่จัดกิจกรรม";
  if (!input.details.trim()) return "กรุณากรอกรายละเอียดข่าว";

  const { startIso, endIso } = parseThaiEventDateText(input.publishedDate);
  if (!startIso) return "รูปแบบวันที่จัดกิจกรรมไม่ถูกต้อง";
  if (endIso && endIso < startIso) return "วันสิ้นสุดกิจกรรมต้องไม่ก่อนวันเริ่ม";

  const externalUrl = input.externalUrl.trim();
  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
    return "ลิงก์เพิ่มเติมต้องขึ้นต้นด้วย http:// หรือ https://";
  }

  return null;
}

export async function createNewsAction(
  _prevState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readNewsInput(formData);
  const validationError = validateNewsInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    const attachmentFile = formData.get("attachment");
    const newsId = await createAdminNews(
      input,
      imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
      attachmentFile instanceof File && attachmentFile.size > 0 ? attachmentFile : null,
    );
    revalidateNewsCaches();
    redirect(`/admin/news/${newsId}/edit?saved=1`);
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกข่าวได้",
    };
  }
}

export async function updateNewsAction(
  newsId: string,
  _prevState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readNewsInput(formData);
  const validationError = validateNewsInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    const attachmentFile = formData.get("attachment");
    await updateAdminNews(
      newsId,
      input,
      imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
      formData.get("removeImage") === "on",
      attachmentFile instanceof File && attachmentFile.size > 0 ? attachmentFile : null,
      formData.get("removeAttachment") === "on",
    );
    revalidateNewsCaches();
    return { success: "บันทึกข่าวเรียบร้อยแล้ว" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกข่าวได้",
    };
  }
}

export async function deleteNewsAction(newsId: string): Promise<NewsActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  try {
    await deleteAdminNews(newsId);
    revalidateNewsCaches();
    redirect("/admin/news?deleted=1");
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถลบข่าวได้",
    };
  }
}
