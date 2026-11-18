import { expandQueryTokens, normalizeTopicQueryText } from "@/lib/ai/text-utils";

const ELIGIBILITY_LINE =
  /(คุณสมบัติ|ผู้สมัคร|คณาจารย์|มหาบัณฑิต|นักศึกษา|อาจารย์รุ่นเยาว์|eligible|eligibility|ต้องเป็น|จะต้องเป็น|หากเรียนจบแล้ว|ต้องได้รับการอนุมัติ|ไม่สามารถสมัคร|เฉพาะ)/i;

const REQUIREMENT_CONTINUATION =
  /^(ต้อง|จะต้อง|เป็น|ผู้สมัคร|หาก|ไม่สามารถ|นักศึกษา|คณาจารย์|อาจารย์รุ่นเยาว์|จบ|กำลังศึกษา|•|-|–|\*)/;

export function extractFundingTopicLines(details: string, title: string): string[] {
  const lines = `${title}\n${details}`
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-\*🔹📢🎓📌⚠️📥⌛🧾]+\s*/, "").trim())
    .filter(Boolean);

  const topicLines = lines.filter((line) => /^(กลุ่มเรื่อง|แผนงานย่อย)/.test(line));

  return [...new Set([title, ...topicLines])];
}

export function fundingSearchTerms(title: string, details: string): string[] {
  const blob = extractFundingTopicLines(details, title).join(" ");
  return expandQueryTokens(blob);
}

export function extractEligibilityRequirements(details: string, title: string): string[] {
  const text = `${title}\n${details}`.trim();
  if (!text || text === "-") return [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-\*🔹]+\s*/, "").trim())
    .filter((line) => line.length >= 6);

  const matched: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!ELIGIBILITY_LINE.test(lines[index])) continue;
    matched.push(lines[index]);
    for (const next of lines.slice(index + 1, index + 4)) {
      if (REQUIREMENT_CONTINUATION.test(next) || ELIGIBILITY_LINE.test(next)) {
        matched.push(next);
      }
    }
  }
  return [...new Set(matched)].slice(0, 8);
}

export function normalizeMatchText(value: string): string {
  return normalizeTopicQueryText(value);
}
