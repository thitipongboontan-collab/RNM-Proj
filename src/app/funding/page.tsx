import { Suspense } from "react";
import { FundingPage } from "@/components/funding/FundingPage";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";
import { SITE_PAGE_KEYS } from "@/lib/analytics/site-pages";
import { incrementSitePageView } from "@/lib/analytics/views";
import { getFundingSummaries } from "@/lib/funding-repository";

export const revalidate = 300;

export default async function Page() {
  await incrementSitePageView(SITE_PAGE_KEYS.funding);
  const items = await getFundingSummaries();
  return (
    <Suspense fallback={<RouteLoadingSkeleton titleWidth="8rem" />}>
      <FundingPage items={items} />
    </Suspense>
  );
}
