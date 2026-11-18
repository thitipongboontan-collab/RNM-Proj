import type { FundingRecord } from "@/lib/assistant-dataset";

export type FundingCallSource = Pick<FundingRecord, "row" | "attachments">;

export function getFundingCallText(funding: FundingCallSource): string {
  const details = (funding.row.details ?? "").trim();
  const parts: string[] = [];
  if (details && details !== "-") {
    parts.push(details);
  }

  for (const attachment of funding.attachments ?? []) {
    const extracted = attachment.extracted_text?.trim();
    if (!extracted) continue;
    parts.push(extracted);
  }

  return parts.join("\n\n");
}
