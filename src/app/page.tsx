import { HomePage } from "@/components/home/HomePage";
import { getResearchNews } from "@/lib/research-news-repository";

export default async function Page() {
  const newsItems = await getResearchNews();
  return <HomePage newsItems={newsItems} />;
}
