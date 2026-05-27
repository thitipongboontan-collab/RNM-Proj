import { notFound } from "next/navigation";
import { FundingDetailPage } from "@/components/funding/FundingDetailPage";
import { getFundings } from "@/lib/funding-repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const items = await getFundings();
  const item = items.find((entry) => entry.id === id);
  if (!item) notFound();

  const index = items.findIndex((entry) => entry.id === id);
  const prevId = index > 0 ? items[index - 1]?.id : undefined;
  const nextId = index >= 0 && index < items.length - 1 ? items[index + 1]?.id : undefined;

  return (
    <FundingDetailPage
      item={item}
      page={index + 1}
      totalPages={items.length}
      prevId={prevId}
      nextId={nextId}
    />
  );
}
