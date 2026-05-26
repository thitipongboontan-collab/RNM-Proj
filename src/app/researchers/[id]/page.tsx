import { notFound } from "next/navigation";
import { ResearcherDetailPage } from "@/components/researchers/ResearcherDetailPage";
import { getResearcherById } from "@/lib/researchers-repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const item = await getResearcherById(id);
  if (!item) notFound();
  return <ResearcherDetailPage item={item} />;
}
