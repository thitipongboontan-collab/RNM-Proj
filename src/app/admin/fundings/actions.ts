"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  createAdminFunding,
  deleteAdminFunding,
  deleteAdminFundingAttachment,
  updateAdminFunding,
} from "@/lib/admin/funding-admin";
import type { AdminFundingFormInput } from "@/lib/admin/funding-types";
import { revalidateFundingCaches } from "@/lib/admin/revalidate";

export type FundingActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
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
  };
}

function readAttachmentFiles(formData: FormData): File[] {
  const entries = formData.getAll("attachments");
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
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
      readAttachmentFiles(formData),
    );
    revalidateFundingCaches();
    return { redirectTo: `/admin/fundings/${fundingId}/edit?saved=1` };
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
      readAttachmentFiles(formData),
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
