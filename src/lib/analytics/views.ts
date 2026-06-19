import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type { SitePageKey } from "@/lib/analytics/site-pages";
import { countViewOnce } from "@/lib/analytics/view-session";
import { incrementResearchNewsViews as incrementResearchNewsViewCount } from "@/lib/research-news-views";

async function incrementCounter(
  table: string,
  idColumn: string,
  idValue: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const { data, error } = await admin
    .from(table)
    .select("view_count")
    .eq(idColumn, idValue)
    .maybeSingle();

  if (error || !data) return;

  await admin
    .from(table)
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq(idColumn, idValue);
}

export async function incrementFundingViews(fundingId: string): Promise<boolean> {
  return countViewOnce(`funding:${fundingId}`, () =>
    incrementCounter("fundings", "funding_id", fundingId),
  );
}

export async function incrementResearcherViews(researcherId: string): Promise<boolean> {
  return countViewOnce(`researcher:${researcherId}`, () =>
    incrementCounter("researchers", "researcher_id", researcherId),
  );
}

export async function incrementResearchNewsViews(newsId: string): Promise<boolean> {
  return countViewOnce(`news:${newsId}`, () => incrementResearchNewsViewCount(newsId));
}

export async function incrementSitePageView(pageKey: SitePageKey): Promise<boolean> {
  return countViewOnce(`page:${pageKey}`, async () => {
    const admin = createSupabaseAdminClient();
    if (!admin) return;

    const { data, error } = await admin
      .from("site_page_views")
      .select("view_count")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (error) return;

    if (data) {
      await admin
        .from("site_page_views")
        .update({
          view_count: (data.view_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("page_key", pageKey);
      return;
    }

    await admin.from("site_page_views").insert({
      page_key: pageKey,
      view_count: 1,
    });
  });
}
