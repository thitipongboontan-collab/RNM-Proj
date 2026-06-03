import {
  findCollaborationLinks,
  formatCollaborationBlock,
  suggestTeamMembers,
} from "@/lib/ai/intelligence/collaboration-graph";
import { normalizeText } from "@/lib/ai/researcher-meta";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { AssistantDataset } from "@/lib/assistant-context";
import { formatResearcherDetail } from "@/lib/ai/tools/researchers";

function researcherCitation(record: AssistantDataset["researchers"][number]): Citation {
  return {
    id: record.row.researcher_id,
    type: "researcher",
    label: record.row.name_th,
    href: `/researchers/${record.row.researcher_id}`,
  };
}

const ORGANIZATION_STOP_WORDS = new Set([
  "university",
  "institute",
  "college",
  "school",
  "faculty",
  "department",
  "center",
  "centre",
  "research",
  "of",
  "the",
  "and",
  "หน่วยงาน",
  "มหาวิทยาลัย",
  "สถาบัน",
]);

function organizationTokens(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9\u0E00-\u0E7F]+/i)
    .filter((token) => token.length >= 2 && !ORGANIZATION_STOP_WORDS.has(token));
}

function scoreOrganizationName(organizationName: string, query: string): number {
  const normalizedName = normalizeText(organizationName);
  const normalizedQuery = normalizeText(query);
  if (normalizedName.length < 3) return 0;
  if (normalizedQuery.includes(normalizedName)) return 1000 + normalizedName.length;

  const nameTokens = organizationTokens(organizationName);
  const queryTokens = organizationTokens(query);
  if (!nameTokens.length || !queryTokens.length) return 0;

  const matchedTokens = nameTokens.filter((token) =>
    queryTokens.some((queryToken) => queryToken === token || token.includes(queryToken)),
  );
  const distinctiveTokenCount = Math.min(nameTokens.length, 3);
  if (matchedTokens.length >= distinctiveTokenCount) {
    return matchedTokens.reduce((sum, token) => sum + token.length, 0);
  }

  if (queryTokens.length === 1 && nameTokens.some((token) => token.includes(queryTokens[0]))) {
    return queryTokens[0].length;
  }

  return 0;
}

function findCollaborationOrganizationNames(dataset: AssistantDataset, query: string): string[] {
  const scoredNames = new Map<string, number>();

  for (const record of dataset.researchers) {
    for (const collaboration of record.collaborations) {
      const organizationName = collaboration.organization_name;
      const score = scoreOrganizationName(organizationName, query);
      if (score > 0) {
        scoredNames.set(organizationName, Math.max(scoredNames.get(organizationName) ?? 0, score));
      }
    }
  }

  return [...scoredNames.entries()]
    .sort(([nameA, scoreA], [nameB, scoreB]) => scoreB - scoreA || nameB.length - nameA.length)
    .map(([name]) => name);
}

export function collaborationOrganizationTool(
  dataset: AssistantDataset,
  query: string,
): ToolExecutionResult | null {
  const organizationNames = findCollaborationOrganizationNames(dataset, query);
  if (!organizationNames.length) return null;

  const matchedName = organizationNames[0];
  const normalizedMatchedName = normalizeText(matchedName);
  const matchedResearchers = dataset.researchers
    .filter((record) =>
      record.collaborations.some(
        (collaboration) => normalizeText(collaboration.organization_name) === normalizedMatchedName,
      ),
    )
    .sort((a, b) => (b.row.scholarly_output ?? 0) - (a.row.scholarly_output ?? 0));

  if (!matchedResearchers.length) return null;

  return {
    name: "collaboration_organization_lookup",
    summary: `พบ ${matchedResearchers.length} คนที่มีความร่วมมือกับ ${matchedName}`,
    contextBlock: [
      "=== TOOL: collaboration_organization_lookup ===",
      `องค์กร/หน่วยงานที่ค้นพบ: ${matchedName}`,
      `จำนวนนักวิจัยที่มีความร่วมมือ: ${matchedResearchers.length} คน`,
      "",
      "=== รายชื่อนักวิจัยที่มีความร่วมมือกับองค์กรนี้ ===",
      matchedResearchers.map(formatResearcherDetail).join("\n\n"),
    ].join("\n"),
    citations: matchedResearchers.map(researcherCitation),
  };
}

export function collaborationRankingTool(
  dataset: AssistantDataset,
  limit = 10,
): ToolExecutionResult {
  const ranked = dataset.researchers
    .map((record) => {
      const organizationNames = [
        ...new Set(record.collaborations.map((item) => item.organization_name)),
      ].sort((a, b) => a.localeCompare(b));
      return {
        record,
        organizationNames,
        organizationCount: organizationNames.length,
        collaborationRows: record.collaborations.length,
      };
    })
    .filter((item) => item.organizationCount > 0)
    .sort((a, b) => {
      if (b.organizationCount !== a.organizationCount) {
        return b.organizationCount - a.organizationCount;
      }
      if (b.collaborationRows !== a.collaborationRows) {
        return b.collaborationRows - a.collaborationRows;
      }
      return (b.record.row.scholarly_output ?? 0) - (a.record.row.scholarly_output ?? 0);
    })
    .slice(0, limit);

  return {
    name: "collaboration_ranking",
    summary: `จัดอันดับนักวิจัยตามจำนวนหน่วยงานความร่วมมือ ${ranked.length} คน`,
    contextBlock: [
      "=== TOOL: collaboration_ranking (จัดอันดับจาก researcher_collaborations) ===",
      "นิยามการนับ: นับจำนวนหน่วยงาน/สถาบันความร่วมมือแบบไม่ซ้ำต่อ researcher_id",
      "",
      ranked
        .map((item, index) =>
          [
            `${index + 1}. [${item.record.row.researcher_id}] ${item.record.row.name_th}${
              item.record.row.name_en ? ` (${item.record.row.name_en})` : ""
            }`,
            `   หน่วยงาน: ${item.record.row.department}`,
            `   จำนวนหน่วยงานความร่วมมือ: ${item.organizationCount}`,
            `   รายชื่อหน่วยงาน: ${item.organizationNames.join(", ")}`,
            `   ลิงก์: /researchers/${item.record.row.researcher_id}`,
          ].join("\n"),
        )
        .join("\n\n"),
    ].join("\n"),
    citations: ranked.map((item) => researcherCitation(item.record)),
  };
}

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
