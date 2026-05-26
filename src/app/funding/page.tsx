import { getFundings } from "@/lib/funding-repository";
import { FundingPage } from "@/components/funding/FundingPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const items = await getFundings();
  return <FundingPage items={items} />;
}
