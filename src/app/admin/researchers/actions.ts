"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  createAdminResearcher,
  deleteAdminResearcher,
  updateAdminResearcher,
} from "@/lib/admin/researcher-admin";
import { isResearcherDepartment } from "@/data/researcher-departments";
import type { AdminResearcherFormInput } from "@/lib/admin/researcher-types";
import { revalidateResearcherCaches } from "@/lib/admin/revalidate";

export type ResearcherActionState = {
  error?: string;
  success?: string;
};

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number.parseInt(trimmed, 10);
  return Number.isFinite(num) ? num : null;
}

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number.parseFloat(trimmed);
  return Number.isFinite(num) ? num : null;
}

function readResearcherInput(formData: FormData): AdminResearcherFormInput {
  return {
    nameTh: String(formData.get("nameTh") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    department: String(formData.get("department") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    scholarlyOutput: Number.parseInt(String(formData.get("scholarlyOutput") ?? "0"), 10) || 0,
    citations: Number.parseInt(String(formData.get("citations") ?? "0"), 10) || 0,
    hIndex: Number.parseInt(String(formData.get("hIndex") ?? "0"), 10) || 0,
    mostRecentPublicationYear: parseOptionalInt(String(formData.get("mostRecentPublicationYear") ?? "")),
    citationsPerPublication: parseOptionalFloat(String(formData.get("citationsPerPublication") ?? "")),
    fieldWeightedCitationImpact: parseOptionalFloat(
      String(formData.get("fieldWeightedCitationImpact") ?? ""),
    ),
    educationText: String(formData.get("educationText") ?? ""),
    expertiseText: String(formData.get("expertiseText") ?? ""),
    keywordsEnText: String(formData.get("keywordsEnText") ?? ""),
    keywordsThText: String(formData.get("keywordsThText") ?? ""),
    collaborationsText: String(formData.get("collaborationsText") ?? ""),
  };
}

function validateResearcherInput(input: AdminResearcherFormInput): string | null {
  if (!input.nameTh.trim()) return "กรุณากรอกชื่อภาษาไทย";
  if (!input.department.trim()) return "กรุณาเลือกภาควิชา";
  if (!isResearcherDepartment(input.department.trim())) return "กรุณาเลือกภาควิชาที่ถูกต้อง";

  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "รูปแบบอีเมลไม่ถูกต้อง";
  }

  return null;
}

export async function createResearcherAction(
  _prevState: ResearcherActionState,
  formData: FormData,
): Promise<ResearcherActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readResearcherInput(formData);
  const validationError = validateResearcherInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    const researcherId = await createAdminResearcher(
      input,
      imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
    );
    revalidateResearcherCaches(researcherId);
    redirect(`/admin/researchers/${researcherId}/edit?saved=1`);
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกนักวิจัยได้",
    };
  }
}

export async function updateResearcherAction(
  researcherId: string,
  _prevState: ResearcherActionState,
  formData: FormData,
): Promise<ResearcherActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  const input = readResearcherInput(formData);
  const validationError = validateResearcherInput(input);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageFile = formData.get("image");
    await updateAdminResearcher(
      researcherId,
      input,
      imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
      formData.get("removeImage") === "on",
    );
    revalidateResearcherCaches(researcherId);
    return { success: "บันทึกข้อมูลนักวิจัยเรียบร้อยแล้ว" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกนักวิจัยได้",
    };
  }
}

export async function deleteResearcherAction(researcherId: string): Promise<ResearcherActionState> {
  try {
    await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }

  try {
    await deleteAdminResearcher(researcherId);
    revalidateResearcherCaches(researcherId);
    redirect("/admin/researchers?deleted=1");
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถลบนักวิจัยได้",
    };
  }
}
