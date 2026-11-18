import assert from "node:assert/strict";
import {
  classifyExtractedText,
  extractFundingDocumentText,
  FUNDING_DOCUMENT_MAX_BYTES,
  normalizeExtractedDocumentText,
} from "@/lib/funding-intelligence/extract-attachment-text";
import { getFundingCallText } from "@/lib/matching/call-text";

assert.equal(classifyExtractedText("", 3).status, "needs_ocr");
assert.equal(classifyExtractedText("ab", 1).status, "needs_ocr");
assert.equal(
  classifyExtractedText(
    "คุณสมบัติผู้สมัคร เป็นคณาจารย์ในสถาบันอุดมศึกษา กลุ่มเรื่อง มลพิษอากาศและหมอกควันภาคเหนือ",
    1,
  ).status,
  "extracted",
);

const normalized = normalizeExtractedDocumentText("บรรทัดหนึ่ง  \n\n\nบรรทัดสอง\r\n");
assert.equal(normalized.includes("บรรทัดหนึ่ง"), true);
assert.doesNotMatch(normalized, /\n{3,}/);

async function runAsyncCases() {
  const oversized = await extractFundingDocumentText(
    Buffer.alloc(FUNDING_DOCUMENT_MAX_BYTES + 1),
    "call.pdf",
  );
  assert.equal(oversized.status, "too_large");

  const unsupported = await extractFundingDocumentText(Buffer.from("hello"), "notes.txt");
  assert.equal(unsupported.status, "unsupported");
}

const callText = getFundingCallText({
  row: {
    funding_id: "FD007",
    title: "ประกาศทุน",
    organization: "วช.",
    status_label: "ทุนวิจัยที่เปิดรับ",
    open_date: "-",
    close_date: "-",
    published_date: "-",
    details: "-",
    source_url: null,
  },
  attachments: [
    {
      funding_id: "FD007",
      file_name: "call.pdf",
      extracted_text: "คุณสมบัติผู้สมัคร เป็นคณาจารย์\nกลุ่มเรื่อง มลพิษอากาศ",
    },
  ],
});
assert.match(callText, /คณาจารย์/);
assert.match(callText, /มลพิษอากาศ/);
assert.doesNotMatch(callText, /^-$/);

runAsyncCases()
  .then(() => {
    console.log("funding attachment extraction tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
