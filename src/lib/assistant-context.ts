export {
  getAssistantDataset,
  type AssistantDataset,
  type FundingRecord,
  type ResearcherRecord,
} from "@/lib/assistant-dataset";

export async function buildAssistantPlatformContext(
  message: string,
  apiKey?: string,
): Promise<string> {
  const { runAssistantPipeline } = await import("@/lib/ai/pipeline");
  const result = await runAssistantPipeline(message, apiKey);
  return result.platformContext;
}
