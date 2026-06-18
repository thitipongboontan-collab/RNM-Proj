"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  createAdminFunding,
  deleteAdminFunding,
  deleteAdminFundingAttachment,
  deleteAdminFundingDetailImage,
  prepareFundingDetailImageUpload,
  prepareFundingDocumentUpload,
  registerFundingDetailImage,
  registerFundingDocumentAttachment,
  updateAdminFunding,
} from "@/lib/admin/funding-admin";
import type { AdminFundingFormInput } from "@/lib/admin/funding-types";
import { revalidateFundingCaches } from "@/lib/admin/revalidate";
import { normalizeImagePosition } from "@/lib/image-position";

export type FundingActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  fundingId?: string;
};

function readFundingInput(formData: FormData): AdminFundingFormInput {
  return {
    title: String(formData.get("title") ?? ""),
    fullTitle: String(formData.get("fullTitle") ?? ""),
    fundingCode: String(formData.get("fundingCode") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    statusLabel: String(formData.get("statusLabel") ?? "ทุนวิจัยที่เปิดรับ"),
    publishedDate: String(formData.get("publishedDate") ?? ""),
    openDate: String(formData.get("openDate") ?? ""),
    closeDate: String(formData.get("closeDate") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    details: String(formData.get("details") ?? ""),
    displayOrder: Number.parseInt(String(formData.get("displayOrder") ?? "0"), 10) || 0,
    imagePosition: normalizeImagePosition(String(formData.get("imagePosition") ?? "")),
  };
}

function readAttachmentFiles(): File[] {
  return [];
}

function validateFundingInput(input: AdminFundingFormInput): string | null {
  if (!input.title.trim()) return "กรุณากรอกชื่อทุน";
  if (!input.organization.trim()) return "กรุณากรอกหน่วยงาน";
  if (!input.publishedDate.trim()) return "กรุณากรอกวันที่ประกาศ";
  if (!input.openDate.trim()) return "กรุณากรอกวันเปิดรับ";
  if (!input.closeDate.trim()) return "กรุณากรอกวันปิดรับ";
  if (!input.details.trim()) return "กรุณากรอกรายละเอียดทุน";
  return null;
}

export async function createFundingAction(
  _prevState: FundingActionState,
  formData: FormData,
): Promise<FundingActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readFundingInput(formData);
  const validationError = validateFundingInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    const fundingId = await createAdminFunding(
      input,
      imageFile instanceof File ? imageFile : null,
      readAttachmentFiles(),
    );
    revalidateFundingCaches();
    return {
      fundingId,
      redirectTo: `/admin/fundings/${fundingId}/edit?saved=1`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกแหล่งทุนได้",
    };
  }
}

export async function updateFundingAction(
  fundingId: string,
  _prevState: FundingActionState,
  formData: FormData,
): Promise<FundingActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readFundingInput(formData);
  const validationError = validateFundingInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    await updateAdminFunding(
      fundingId,
      input,
      imageFile instanceof File ? imageFile : null,
      readAttachmentFiles(),
      formData.get("removeImage") === "on",
    );
    revalidateFundingCaches();
    return { success: "บันทึกแหล่งทุนเรียบร้อยแล้ว" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกแหล่งทุนได้",
    };
  }
}

export async function deleteFundingAction(fundingId: string): Promise<FundingActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  try {
    await deleteAdminFunding(fundingId);
    revalidateFundingCaches();
    redirect("/admin/fundings?deleted=1");
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถลบแหล่งทุนได้",
    };
  }
}

export async function prepareFundingAttachmentUploadAction(
  fundingId: string,
  fileName: string,
  fileOrder: number,
) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  return prepareFundingDocumentUpload(fundingId, fileName, fileOrder);
}

export async function completeFundingAttachmentUploadAction(
  fundingId: string,
  attachment: {
    storagePath: string;
    fileName: string;
    fileType: "pdf" | "doc";
    fileOrder: number;
  },
): Promise<void> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  await registerFundingDocumentAttachment(fundingId, attachment);
  revalidateFundingCaches();
}

export async function deleteFundingAttachmentAction(
  fundingId: string,
  attachmentId: number,
): Promise<FundingActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  try {
    await deleteAdminFundingAttachment(fundingId, attachmentId);
    revalidateFundingCaches();
    return { success: "ลบไฟล์แนบแล้ว" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถลบไฟล์แนบได้",
    };
  }
}

export async function prepareFundingDetailImageUploadAction(
  fundingId: string,
  fileName: string,
  imageOrder: number,
) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  return prepareFundingDetailImageUpload(fundingId, fileName, imageOrder);
}

export async function completeFundingDetailImageUploadAction(
  fundingId: string,
  image: {
    storagePath: string;
    imageOrder: number;
  },
): Promise<void> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  await registerFundingDetailImage(fundingId, image);
  revalidateFundingCaches();
}

export async function deleteFundingDetailImageAction(
  fundingId: string,
  imageId: number,
): Promise<FundingActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  try {
    await deleteAdminFundingDetailImage(fundingId, imageId);
    revalidateFundingCaches();
    return { success: "ลบรูปภาพแล้ว" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถลบรูปภาพได้",
    };
  }
}
