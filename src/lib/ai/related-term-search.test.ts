import assert from "node:assert/strict";
import { expandQueryTokens } from "@/lib/ai/text-utils";
import { searchResearchersByPublicationTool } from "@/lib/ai/tools/publication-search";
import type { ResearcherRecord } from "@/lib/assistant-dataset";

const question = "มีนักวิจัยคนไหนที่ทำงานวิจัยเกี่ยวกับพื้นที่เฒ่าใหม่บ้างไหม";
const tokens = expandQueryTokens(question);

assert.ok(tokens.includes("เฒ่าใหม่"), "keeps the original Thai place name");
assert.ok(tokens.includes("mae mai"), "adds the English place-name equivalent");
assert.ok(tokens.includes("thao mai"), "adds a romanized variant");

const record = {
  row: {
    researcher_id: "RS999",
    name_th: "อาจารย์ ทดสอบ",
    name_en: "Test Researcher",
    department: "ภาควิชาภูมิศาสตร์",
    email_raw: null,
    scholarly_output: 1,
    citations: 0,
    h_index: 0,
  },
  keywords: [],
  expertise: [],
  degrees: [],
  publications: [
    {
      researcher_id: "RS999",
      title: "Community livelihoods in Mae Mai, Chiang Mai",
      year: 2024,
    },
  ],
  collaborations: [],
  projects: [
    {
      researcher_id: "RS999",
      project_name: "Highland adaptation in Ban Thao Mai",
      role_label: "หัวหน้าโครงการ",
      fiscal_year_be: 2568,
    },
  ],
  searchText: "community livelihoods in mae mai chiang mai highland adaptation in ban thao mai",
} satisfies ResearcherRecord;

const result = searchResearchersByPublicationTool([record], question, { titles: [] }, 8);
assert.ok(result, "finds a researcher from related English titles");
assert.match(result?.contextBlock ?? "", /RS999/);
assert.match(result?.contextBlock ?? "", /Mae Mai|Thao Mai/);

console.log("related term search tests passed");
