import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateFundingCaches() {
  revalidateTag("funding-summaries");
  revalidateTag("fundings-full");
  revalidatePath("/funding");
  revalidatePath("/admin/fundings");
}

export function revalidateNewsCaches() {
  revalidateTag("research-news");
  revalidatePath("/");
  revalidatePath("/admin/news");
  revalidatePath("/news", "layout");
}
