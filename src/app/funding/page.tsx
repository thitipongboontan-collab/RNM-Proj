import { getFundingSummaries } from "@/lib/funding-repository";
import { FundingPage } from "@/components/funding/FundingPage";

export const revalidate = 300;

export default async function Page() {
  const items = await getFundingSummaries();
  return <FundingPage items={items} />;
}
