import { notFound } from "next/navigation";
import { ResearcherMatchPage } from "@/components/researchers/ResearcherMatchPage";
import { getResearcherById } from "@/lib/researchers-repository";
import { getResearcherMatchResult } from "@/lib/match-service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [researcher, match] = await Promise.all([
    getResearcherById(id),
    getResearcherMatchResult(id),
  ]);

  if (!researcher || !match) notFound();

  return (
    <ResearcherMatchPage
      researcherId={id}
      researcherName={researcher.name}
      intelligence={match.researcher}
      fundings={match.fundings}
      publicationTrend={match.publicationTrend}
    />
  );
}
