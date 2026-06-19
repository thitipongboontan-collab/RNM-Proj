import { notFound } from "next/navigation";
import { FundingDetailPage } from "@/components/funding/FundingDetailPage";
import { getFundingById, getFundingNavigation } from "@/lib/funding-repository";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [item, navigation] = await Promise.all([
    getFundingById(id),
    getFundingNavigation(id),
  ]);
  if (!item) notFound();

  return (
    <FundingDetailPage
      item={item}
      page={navigation.index + 1}
      totalPages={navigation.totalPages}
      prevId={navigation.prevId}
      nextId={navigation.nextId}
    />
  );
}
