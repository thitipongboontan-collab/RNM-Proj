import { HomePage } from "@/components/home/HomePage";
import { SITE_PAGE_KEYS } from "@/lib/analytics/site-pages";
import { incrementSitePageView } from "@/lib/analytics/views";
import { getResearchNews } from "@/lib/research-news-repository";

export default async function Page() {
  await incrementSitePageView(SITE_PAGE_KEYS.home);
  const newsItems = await getResearchNews();
  return <HomePage newsItems={newsItems} />;
}
