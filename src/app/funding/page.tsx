import { Suspense } from "react";
import { getFundingSummaries } from "@/lib/funding-repository";
import { FundingPage } from "@/components/funding/FundingPage";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";

export const revalidate = 300;

export default async function Page() {
  const items = await getFundingSummaries();
  return (
    <Suspense fallback={<RouteLoadingSkeleton titleWidth="8rem" />}>
      <FundingPage items={items} />
    </Suspense>
  );
}
