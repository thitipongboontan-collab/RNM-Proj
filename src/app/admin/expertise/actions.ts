"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  analyzeResearcherExpertise,
  saveExpertiseReview,
} from "@/lib/expertise/repository";

function researcherIdFrom(formData: FormData): string {
  const researcherId = String(formData.get("researcherId") ?? "").trim();
  if (!researcherId) throw new Error("ไม่พบรหัสนักวิจัย");
  return researcherId;
}

export async function analyzeExpertiseAction(formData: FormData) {
  await requireAdminSession();
  const researcherId = researcherIdFrom(formData);
  await analyzeResearcherExpertise(researcherId, { force: formData.get("force") === "1" });
  revalidatePath("/admin/expertise");
  revalidatePath(`/admin/expertise/${researcherId}`);
}

export async function saveExpertiseReviewAction(formData: FormData) {
  const user = await requireAdminSession();
  const researcherId = researcherIdFrom(formData);
  await saveExpertiseReview({
    researcherId,
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? ""),
    reviewer: user.email ?? user.id,
    primaryText: String(formData.get("primary") ?? ""),
    secondaryText: String(formData.get("secondary") ?? ""),
    methodsText: String(formData.get("methods") ?? ""),
    geographyText: String(formData.get("geography") ?? ""),
    populationsText: String(formData.get("populations") ?? ""),
    domainsText: String(formData.get("domains") ?? ""),
  });
  revalidatePath("/admin/expertise");
  revalidatePath(`/admin/expertise/${researcherId}`);
}
