import { notFound } from "next/navigation";
import { ResearchNewsDetailPage } from "@/components/news/ResearchNewsDetailPage";
import {
  getResearchNewsById,
} from "@/lib/research-news-repository";
import { incrementResearchNewsViews } from "@/lib/analytics/views";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const item = await getResearchNewsById(id);
  if (!item) notFound();

  const counted = await incrementResearchNewsViews(id);

  return <ResearchNewsDetailPage item={{ ...item, views: item.views + (counted ? 1 : 0) }} />;
}
