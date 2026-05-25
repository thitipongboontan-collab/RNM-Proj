import { notFound } from "next/navigation";
import { FundingDetailPage } from "@/components/funding/FundingDetailPage";
import { getFundingById } from "@/data/funding";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const item = getFundingById(id);
  if (!item) notFound();
  return <FundingDetailPage item={item} />;
}
