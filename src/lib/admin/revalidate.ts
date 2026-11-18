import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateFundingCaches() {
  revalidateTag("funding-summaries");
  revalidateTag("fundings-full");
  revalidateTag("assistant-dataset");
  revalidatePath("/funding");
  revalidatePath("/admin/fundings");
}

export function revalidateNewsCaches() {
  revalidateTag("research-news");
  revalidatePath("/");
  revalidatePath("/admin/news");
  revalidatePath("/news", "layout");
}

export function revalidateResearcherCaches(researcherId?: string) {
  revalidateTag("researchers-list");
  revalidateTag("assistant-dataset");
  revalidatePath("/researchers");
  revalidatePath("/admin/researchers");
  if (researcherId) {
    revalidatePath(`/researchers/${researcherId}`);
  }
}
