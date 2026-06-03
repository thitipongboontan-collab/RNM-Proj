import {
  extractResearcherId,
  findResearchersByNameQuery,
  normalizeText,
} from "@/lib/ai/researcher-meta";
import type { ConversationTurn } from "@/lib/ai/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

export type ResolvedConversationContext = {
  effectiveMessage: string;
  contextResearcherIds: string[];
  primaryResearcherId?: string;
  isFollowUp: boolean;
};

const FOLLOW_UP_PRONOUNS =
  /(เขา|เธอ|คนนี้|ท่านนี้|คนนั้น|รายนี้|ท่าน|คนที่(?:ว่า|บอก|กล่าว))/;

const CONTINUATION_PREFIX =
  /^(แล้ว|ต่อ|อีก|จากนั้น|จากที่|โดยเฉพาะ|ส่วน|ขอทราบ|ช่วย(?:บอก|อธิบาย))/;

function extractResearcherIdsFromText(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const id = value.toUpperCase();
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  for (const match of text.matchAll(/\/researchers\/(RS\d{3})/gi)) {
    add(match[1]);
  }
  for (const match of text.matchAll(/\[(RS\d{3})\]/gi)) {
    add(match[1]);
  }
  for (const match of text.matchAll(/\b(RS\d{3})\b/gi)) {
    add(match[1]);
  }

  return ids;
}

function extractFocusResearcherIds(
  history: ConversationTurn[],
  researchers: ResearcherRecord[],
): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    for (const id of extractResearcherIdsFromText(turn.content)) add(id);
    for (const id of findResearchersByNameQuery(turn.content, researchers, 3)) add(id);
    if (ordered.length) break;
  }

  return ordered;
}

export function isFollowUpQuestion(
  message: string,
  researchers: ResearcherRecord[] = [],
): boolean {
  const normalized = normalizeText(message);
  if (extractResearcherId(message)) return false;
  if (findResearchersByNameQuery(message, researchers, 1).length) return false;

  // คำถามค้นหา/สำรวจ (เช่น "มีนักวิจัยคนไหน...บ้าง") ไม่ใช่คำถามต่อเนื่อง
  if (
    /(คนไหน|ใคร|who|which)/.test(normalized) ||
    (/(มี.*บ้าง|บ้างไหม|มีไหม)/.test(normalized) &&
      /(นักวิจัย|researcher|อาจารย์)/.test(normalized))
  ) {
    return false;
  }

  if (FOLLOW_UP_PRONOUNS.test(normalized)) return true;
  if (CONTINUATION_PREFIX.test(normalized)) return true;

  const asksAboutResearcherDetail =
    /(เครือข่าย|ความร่วมมือ|collaboration|network|การศึกษา|วุฒิ|ปริญญา|เรียนจบ|education|degree|ความเชี่ยวชาญ|expertise|ผลงาน|ตีพิมพ์|publication|h-index|citation|scholarly)/.test(
      normalized,
    );

  return asksAboutResearcherDetail && normalized.length <= 120;
}

function buildContextNote(
  researchers: ResearcherRecord[],
  researcherId: string,
): string {
  const record = researchers.find((item) => item.row.researcher_id === researcherId);
  const name = record?.row.name_th ?? researcherId;
  return `[บริบทการสนทนา: คำถามนี้อ้างถึงนักวิจัย ${name} (${researcherId}) จากคำตอบก่อนหน้า]`;
}

export function resolveConversationContext(
  message: string,
  history: ConversationTurn[],
  researchers: ResearcherRecord[],
): ResolvedConversationContext {
  const fromMessage = extractResearcherId(message);
  const fromMessageNames = findResearchersByNameQuery(message, researchers, 3);
  const contextResearcherIds = extractFocusResearcherIds(history, researchers);
  const isFollowUp =
    history.length > 0 &&
    isFollowUpQuestion(message, researchers) &&
    contextResearcherIds.length > 0 &&
    !fromMessage &&
    fromMessageNames.length === 0;

  const primaryResearcherId =
    fromMessage ?? fromMessageNames[0] ?? (isFollowUp ? contextResearcherIds[0] : undefined);

  const mergedContextIds = [
    ...(primaryResearcherId ? [primaryResearcherId] : []),
    ...contextResearcherIds.filter((id) => id !== primaryResearcherId),
    ...fromMessageNames.filter((id) => id !== primaryResearcherId),
  ];

  let effectiveMessage = message;
  if (isFollowUp && primaryResearcherId) {
    effectiveMessage = `${message}\n\n${buildContextNote(researchers, primaryResearcherId)}`;
  }

  return {
    effectiveMessage,
    contextResearcherIds: mergedContextIds,
    primaryResearcherId,
    isFollowUp,
  };
}

export function formatConversationHistoryBlock(history: ConversationTurn[]): string {
  if (!history.length) return "";

  const recent = history.slice(-6);
  const lines = recent.map((turn, index) => {
    const label = turn.role === "user" ? "ผู้ใช้" : "AI";
    return `${index + 1}. ${label}: ${turn.content.replace(/\s+/g, " ").trim()}`;
  });

  return ["=== ประวัติการสนทนาล่าสุด ===", ...lines].join("\n");
}

export function normalizeConversationHistory(raw: unknown): ConversationTurn[] {
  if (!Array.isArray(raw)) return [];

  const turns: ConversationTurn[] = [];
  for (const item of raw.slice(-12)) {
    if (!item || typeof item !== "object") continue;
    const record = item as ConversationTurn;
    if (record.role !== "user" && record.role !== "assistant") continue;
    if (typeof record.content !== "string") continue;
    const content = record.content.trim();
    if (!content) continue;
    turns.push({
      role: record.role,
      content: content.slice(0, 6000),
    });
  }

  return turns;
}
