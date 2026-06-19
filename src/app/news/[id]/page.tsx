import { notFound } from "next/navigation";
import { ResearchNewsDetailPage } from "@/components/news/ResearchNewsDetailPage";
import {
  getResearchNewsById,
} from "@/lib/research-news-repository";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const item = await getResearchNewsById(id);
  if (!item) notFound();

  return <ResearchNewsDetailPage item={item} />;
}
