import { scoreText, truncate } from "@/lib/ai/text-utils";
import type { Citation, ToolExecutionResult } from "@/lib/ai/types";
import type { FundingRecord } from "@/lib/assistant-context";

function fundingCitation(record: FundingRecord): Citation {
  return {
    id: record.row.funding_id,
    type: "funding",
    label: record.row.title,
    href: `/funding/${record.row.funding_id}`,
  };
}

function formatFundingDetail(record: FundingRecord): string {
  const { row, attachments } = record;
  const lines = [
    `[${row.funding_id}] ${row.title}`,
    `  หน่วยงาน: ${row.organization}`,
    `  สถานะ: ${row.status_label}`,
    `  เปิดรับ: ${row.open_date} | ปิดรับ: ${row.close_date}`,
    `  สรุป: ${truncate(row.details, 400)}`,
  ];

  if (attachments.length) {
    lines.push(`  ไฟล์แนบ: ${attachments.map((item) => item.file_name).join(", ")}`);
  }

  lines.push(`  ลิงก์: /funding/${row.funding_id}`);
  return lines.join("\n");
}

export function searchFundingsTool(
  records: FundingRecord[],
  queryTokens: string[],
  vectorScores: Map<string, number>,
  limit = 5,
): ToolExecutionResult {
  const ranked = [...records]
    .map((record) => {
      const keywordScore = scoreText(record.searchText, queryTokens);
      const vectorScore = vectorScores.get(record.row.funding_id) ?? 0;
      const combined = vectorScore * 100 + keywordScore;
      return { record, combined, vectorScore, keywordScore };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, limit);

  const citations = ranked.map((item) => fundingCitation(item.record));

  return {
    name: "search_fundings",
    summary: `ค้นพบ ${ranked.length} แหล่งทุนที่เกี่ยวข้อง`,
    contextBlock: [
      `=== TOOL: search_fundings (${ranked.length} รายการ) ===`,
      ranked.length
        ? ranked.map((item) => formatFundingDetail(item.record)).join("\n\n")
        : "- ไม่พบแหล่งทุนที่ตรงเงื่อนไข",
    ].join("\n"),
    citations,
  };
}

export function buildFundingOverviewBlock(records: FundingRecord[]): string {
  return `แหล่งทุนทั้งหมด: ${records.length} รายการ`;
}
