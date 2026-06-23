import { notFound } from "next/navigation";
import { ResearcherDetailPage } from "@/components/researchers/ResearcherDetailPage";
import { getResearcherById } from "@/lib/researchers-repository";

export const dynamic = "force-dynamic";

const PROFILE_TABS = ["expertise", "projects", "publications", "collaborations"] as const;

type ProfileTabId = (typeof PROFILE_TABS)[number];

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function resolveProfileTab(tab?: string): ProfileTabId {
  if (tab && PROFILE_TABS.includes(tab as ProfileTabId)) {
    return tab as ProfileTabId;
  }

  return "expertise";
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const item = await getResearcherById(id);
  if (!item) notFound();

  return <ResearcherDetailPage item={item} initialTab={resolveProfileTab(tab)} />;
}
