import type { CollaborationLink } from "@/lib/ai/intelligence/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

function normalizeOrg(name: string): string {
  return name.trim().toLowerCase();
}

function orgSet(record: ResearcherRecord): Set<string> {
  return new Set(
    record.collaborations
      .map((row) => row.organization_name)
      .filter((org) => org && org !== "-")
      .map(normalizeOrg),
  );
}

export function findCollaborationLinks(
  target: ResearcherRecord,
  allResearchers: ResearcherRecord[],
  limit = 6,
): CollaborationLink[] {
  const targetOrgs = orgSet(target);
  if (!targetOrgs.size) return [];

  const links: CollaborationLink[] = [];

  for (const candidate of allResearchers) {
    if (candidate.row.researcher_id === target.row.researcher_id) continue;

    const candidateOrgs = orgSet(candidate);
    const shared = [...targetOrgs].filter((org) => candidateOrgs.has(org));
    if (!shared.length) continue;

    links.push({
      researcherId: candidate.row.researcher_id,
      nameTh: candidate.row.name_th,
      department: candidate.row.department,
      sharedOrganizations: shared,
      overlapScore: shared.length,
    });
  }

  return links.sort((a, b) => b.overlapScore - a.overlapScore).slice(0, limit);
}

export function suggestTeamMembers(
  target: ResearcherRecord,
  allResearchers: ResearcherRecord[],
  limit = 5,
): CollaborationLink[] {
  const targetKeywords = new Set(
    target.keywords
      .filter((row) => row.keyword_type === "keyword_en")
      .map((row) => row.keyword.toLowerCase()),
  );

  const scored = allResearchers
    .filter((candidate) => candidate.row.researcher_id !== target.row.researcher_id)
    .map((candidate) => {
      const candidateKeywords = candidate.keywords
        .filter((row) => row.keyword_type === "keyword_en")
        .map((row) => row.keyword.toLowerCase());

      const sharedKeywords = candidateKeywords.filter((keyword) => targetKeywords.has(keyword));
      const complementary = candidateKeywords.filter((keyword) => !targetKeywords.has(keyword));
      const sameDepartment = candidate.row.department === target.row.department ? 1 : 0;

      const overlapScore =
        sharedKeywords.length * 2 + Math.min(complementary.length, 4) + sameDepartment;

      const orgLinks = findCollaborationLinks(target, [candidate], 1);

      return {
        researcherId: candidate.row.researcher_id,
        nameTh: candidate.row.name_th,
        department: candidate.row.department,
        sharedOrganizations: orgLinks[0]?.sharedOrganizations ?? [],
        overlapScore,
      };
    })
    .filter((item) => item.overlapScore > 0)
    .sort((a, b) => b.overlapScore - a.overlapScore);

  return scored.slice(0, limit);
}

export function formatCollaborationBlock(
  target: ResearcherRecord,
  links: CollaborationLink[],
  teamSuggestions: CollaborationLink[],
): string {
  const lines = [
    "=== TOOL: collaboration_network ===",
    `นักวิจัย: [${target.row.researcher_id}] ${target.row.name_th}`,
    "",
    `=== เครือข่ายที่ share องค์กร (${links.length} คน) ===`,
    links.length
      ? links
          .map(
            (link) =>
              `- [${link.researcherId}] ${link.nameTh} (${link.department}) — org ร่วม: ${link.sharedOrganizations.join(", ")}`,
          )
          .join("\n")
      : "- ไม่พบเครือข่ายจากข้อมูลองค์กรร่วม",
    "",
    `=== แนะนำผู้ร่วมวิจัย (${teamSuggestions.length} คน) ===`,
    teamSuggestions.length
      ? teamSuggestions
          .map(
            (link) =>
              `- [${link.researcherId}] ${link.nameTh} (${link.department}) — score ${link.overlapScore}`,
          )
          .join("\n")
      : "- ไม่พบคำแนะนำ",
  ];

  return lines.join("\n");
}
