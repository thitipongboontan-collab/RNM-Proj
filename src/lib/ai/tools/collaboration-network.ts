import {
  findCollaborationLinks,
  formatCollaborationBlock,
  suggestTeamMembers,
} from "@/lib/ai/intelligence/collaboration-graph";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";

export function collaborationNetworkTool(
  dataset: AssistantDataset,
  researcherId?: string,
): ToolExecutionResult | null {
  const target = researcherId
    ? dataset.researchers.find((row) => row.row.researcher_id === researcherId)
    : dataset.researchers[0];

  if (!target) return null;

  const links = findCollaborationLinks(target, dataset.researchers, 8);
  const team = suggestTeamMembers(target, dataset.researchers, 5);

  const citations: Citation[] = [
    {
      id: target.row.researcher_id,
      type: "researcher",
      label: target.row.name_th,
      href: `/researchers/${target.row.researcher_id}`,
    },
    ...links.map((link) => ({
      id: link.researcherId,
      type: "researcher" as const,
      label: link.nameTh,
      href: `/researchers/${link.researcherId}`,
    })),
  ];

  return {
    name: "collaboration_network",
    summary: `เครือข่าย ${links.length} คน | แนะนำทีม ${team.length} คน`,
    contextBlock: formatCollaborationBlock(target, links, team),
    citations,
  };
}
