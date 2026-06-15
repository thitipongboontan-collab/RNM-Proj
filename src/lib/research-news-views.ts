import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export async function incrementResearchNewsViews(newsId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const { data, error } = await admin
    .from("research_news")
    .select("view_count")
    .eq("news_id", newsId)
    .maybeSingle();

  if (error || !data) return;

  await admin
    .from("research_news")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("news_id", newsId);
}
