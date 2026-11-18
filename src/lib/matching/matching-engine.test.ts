import assert from "node:assert/strict";
import type { FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { assessExpertiseFundingMatch } from "@/lib/matching/engine";
import { selectProfileForMatching } from "@/lib/matching/profile";
import type { ExpertiseProfile } from "@/lib/expertise/types";

function researcher(
  partial: Partial<ResearcherRecord["row"]> & { name_th: string; researcher_id: string },
  extras: Partial<Pick<ResearcherRecord, "publications" | "projects" | "searchText">> = {},
): ResearcherRecord {
  return {
    row: {
      researcher_id: partial.researcher_id,
      name_th: partial.name_th,
      name_en: partial.name_en ?? null,
      department: partial.department ?? "ภาควิชาภูมิศาสตร์",
      email_raw: null,
      scholarly_output: partial.scholarly_output ?? 40,
      citations: 10,
      h_index: 5,
    },
    keywords: [],
    expertise: [],
    degrees: [],
    publications: extras.publications ?? [
      { researcher_id: partial.researcher_id, title: "PM2.5 haze and biomass burning in Northern Thailand", year: 2024 },
    ],
    collaborations: [],
    projects: extras.projects ?? [
      {
        researcher_id: partial.researcher_id,
        project_name: "Air quality early warning for highland communities",
        role_label: "หัวหน้าโครงการ",
        fiscal_year_be: 2568,
      },
    ],
    searchText: extras.searchText ?? "pm2.5 haze biomass burning northern thailand air quality",
  };
}

function funding(id: string, title: string, details: string, extractedText?: string): FundingRecord {
  return {
    row: {
      funding_id: id,
      title,
      organization: "สำนักงานการวิจัยแห่งชาติ",
      status_label: "ทุนวิจัยที่เปิดรับ",
      open_date: "เปิดรับวันที่ 1 มกราคม 2569",
      close_date: "ปิดรับวันที่ 1 มีนาคม 2569",
      published_date: "1 มกราคม 2569",
      details,
      source_url: null,
    },
    attachments: extractedText
      ? [{ funding_id: id, file_name: "announcement.pdf", extracted_text: extractedText }]
      : [],
    searchText: `${title} ${details} ${extractedText ?? ""}`.toLowerCase(),
  };
}

function profile(
  researcherId: string,
  topics: string[],
  extras: Partial<ExpertiseProfile["expertise_profile"]> = {},
): ExpertiseProfile {
  return {
    researcher_id: researcherId,
    expertise_profile: {
      primary_expertise: topics.map((topic) => ({
        topic,
        confidence: 0.72,
        evidence_count: 3,
        evidence_sources: ["publication"],
        strength: "strong",
        rationale: "titles",
        evidence: [{ id: "p1", source: "publication", label: "PM2.5 haze" }],
      })),
      secondary_expertise: [],
      research_methods: extras.research_methods ?? ["Remote Sensing"],
      geographical_focus: extras.geographical_focus ?? ["Northern Thailand"],
      target_populations: extras.target_populations ?? [],
      research_domains: extras.research_domains ?? [],
      ...extras,
    },
    evidence_summary: {
      total_publications_analyzed: 1,
      total_projects_analyzed: 1,
      total_research_interests: 0,
      duplicate_publications_collapsed: 0,
      dropped_single_mentions: [],
    },
    facet_evidence: {
      research_methods: [],
      geographical_focus: [],
      target_populations: [],
      research_domains: [],
    },
    analysis_status: "ai_analyzed",
    last_analyzed_at: new Date().toISOString(),
    model_version: "evidence-weighted-v1",
    confidence_method: "evidence_weighted_v1",
  };
}

const envFunding = funding(
  "FD004",
  "วช. ด้านทรัพยากรธรรมชาติและสิ่งแวดล้อม",
  "กลุ่มเรื่อง มลพิษอากาศและหมอกควัน\nกลุ่มเรื่อง การเปลี่ยนแปลงสภาพภูมิอากาศ",
);
const socialFunding = funding(
  "FD001",
  "วช. ด้านสังคมและความมั่นคง",
  "กลุ่มเรื่อง พัฒนาสังคมคุณธรรม\nกลุ่มเรื่อง เสริมสร้างธรรมาภิบาลและแก้ไขปัญหาคอร์รัปชัน",
);
const masterFunding = funding(
  "FD023",
  "ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570",
  "เปิดรับโอกาสสำหรับนักศึกษาระดับมหาบัณฑิตด้านมนุษยศาสตร์และสังคมศาสตร์ (หลักสูตรทำวิทยานิพนธ์) เพื่อสนับสนุนการพัฒนาศักยภาพด้านการวิจัย\nผู้สมัครทุนจะต้องได้รับการอนุมัติหัวข้อวิทยานิพนธ์จากต้นสังกัดเรียบร้อยแล้ว หากเรียนจบแล้วไม่สามารถสมัครทุนสนับสนุนการวิจัยได้",
);
const emptyFunding = funding("FD007", "ทุนด้านการเกษตรและนวัตกรรม", "-");
const facultyFunding = funding(
  "FD026",
  "กองทุนพัฒนาคณะสังคมศาสตร์",
  "สำหรับคณาจารย์และนักวิจัยที่สนใจขอรับทุนสนับสนุนในด้านต่าง ๆ ตามหลักเกณฑ์ที่กำหนด",
);
const mixedFunding = funding(
  "FD099",
  "ทุนวิจัยคณะ",
  "คุณสมบัติผู้สมัคร\nนักศึกษาระดับปริญญาโท หรือคณาจารย์รุ่นเยาว์ที่สังกัดมหาวิทยาลัย\nต้องเป็นผู้มีผลงานตีพิมพ์",
);
const scienceCall = funding(
  "FD025",
  "Japan Society for the Promotion of Science (JSPS) Postdoctoral Fellowship",
  "The fellowship supports research in Japan. Apply through the host university science office.",
);

const faculty = researcher({
  researcher_id: "RS030",
  name_th: "อาจารย์ ดร.วรดร ไผ่เรือง",
  department: "ภาควิชาภูมิศาสตร์",
});

const analyzed = selectProfileForMatching({
  researcherId: "RS030",
  analysisStatus: "ai_analyzed",
  displayOrigin: "ai",
  displayProfile: profile("RS030", ["air pollution", "PM2.5"]),
});

const envMatch = assessExpertiseFundingMatch(faculty, envFunding, analyzed);
assert.ok(envMatch.relevance.score > 20, "environment call should score from titles or topics");
assert.ok(envMatch.relevance.evidence.some((item) => item.kind === "publication" || item.kind === "primary_topic"));
assert.equal(envMatch.evidenceConfidence.kind, "evidence_strength");
assert.notEqual(envMatch.eligibility.status, "likely_ineligible");
assert.equal(envMatch.relevance.basis, "expertise");

const socialMatch = assessExpertiseFundingMatch(faculty, socialFunding, analyzed);
assert.ok(
  socialMatch.relevance.score < envMatch.relevance.score,
  "social-governance call must not outrank an air-quality call for an air-quality researcher",
);

const masterMatch = assessExpertiseFundingMatch(faculty, masterFunding, analyzed);
assert.equal(masterMatch.eligibility.status, "likely_ineligible");
assert.ok(masterMatch.eligibility.quotedRequirements.length > 0);
assert.ok(masterMatch.eligibility.researcherFactsUsed.some((fact) => fact.includes("อาจารย์")));
assert.ok(masterMatch.relevance.score >= 0);
assert.notEqual(
  envMatch.eligibility.status,
  masterMatch.eligibility.status,
  "eligibility must not be inferred from research relevance",
);

const emptyMatch = assessExpertiseFundingMatch(faculty, emptyFunding, analyzed);
assert.equal(emptyMatch.eligibility.status, "insufficient_call_data");
assert.notEqual(emptyMatch.eligibility.status, "likely_ineligible");
assert.ok(emptyMatch.relevance.score <= 40, "sparse calls are capped");
assert.equal(emptyMatch.relevance.basis, "sparse_call_title");

const pdfBackedFunding = funding(
  "FD007",
  "ประกาศทุนวิจัย",
  "-",
  [
    "กลุ่มเรื่อง มลพิษอากาศ หมอกควัน และฝุ่นละอองขนาดเล็ก PM2.5",
    "คุณสมบัติผู้สมัคร เป็นคณาจารย์ในสถาบันอุดมศึกษา",
  ].join("\n"),
);
const pdfBackedMatch = assessExpertiseFundingMatch(faculty, pdfBackedFunding, analyzed);
assert.equal(pdfBackedMatch.eligibility.status, "likely_eligible");
assert.ok(pdfBackedMatch.eligibility.quotedRequirements.join(" ").includes("คณาจารย์"));
assert.ok(pdfBackedMatch.relevance.score > emptyMatch.relevance.score);
assert.notEqual(pdfBackedMatch.relevance.basis, "sparse_call_title");

const agriResearcher = researcher(
  { researcher_id: "RS080", name_th: "ผศ.ดร.เกษตร ทดลอง" },
  {
    publications: [
      { researcher_id: "RS080", title: "Sustainable rice farming and agricultural innovation in Northern Thailand", year: 2023 },
    ],
    projects: [
      {
        researcher_id: "RS080",
        project_name: "ระบบเกษตรอัจฉริยะสำหรับพืชไร่ภาคเหนือ",
        role_label: "หัวหน้าโครงการ",
        fiscal_year_be: 2568,
      },
    ],
    searchText: "agriculture rice farming เกษตร",
  },
);
const agriOnSparse = assessExpertiseFundingMatch(
  agriResearcher,
  emptyFunding,
  selectProfileForMatching({
    researcherId: "RS080",
    analysisStatus: "ai_analyzed",
    displayOrigin: "ai",
    displayProfile: profile("RS080", ["agriculture", "rice farming"]),
  }),
);
assert.ok(agriOnSparse.relevance.score > emptyMatch.relevance.score, "an agriculture title should still match a sparse agriculture call");
assert.ok(agriOnSparse.relevance.score <= 40, "sparse-call relevance stays capped");

const facultyMatch = assessExpertiseFundingMatch(faculty, facultyFunding, analyzed);
assert.equal(facultyMatch.eligibility.status, "likely_eligible");
assert.ok(facultyMatch.eligibility.quotedRequirements.join(" ").includes("คณาจารย์"));

const mixedMatch = assessExpertiseFundingMatch(faculty, mixedFunding, analyzed);
assert.equal(mixedMatch.eligibility.status, "needs_review");
assert.ok(mixedMatch.eligibility.reviewReasons.length > 0);

const missingApplicant = assessExpertiseFundingMatch(faculty, socialFunding, analyzed);
assert.equal(missingApplicant.eligibility.status, "unknown");
assert.notEqual(missingApplicant.eligibility.status, "likely_ineligible");

const internFunding = funding(
  "FD098",
  "IITGN-GIF Global Internship Fellowship",
  "โอกาสสำหรับนักศึกษาระดับ ป.ตรี และ ป.โท ร่วมทำวิจัย 6–10 สัปดาห์",
);
const internMatch = assessExpertiseFundingMatch(faculty, internFunding, analyzed);
assert.equal(internMatch.eligibility.status, "likely_ineligible");
assert.ok(internMatch.eligibility.quotedRequirements.join(" ").includes("นักศึกษา"));

const genericMatch = assessExpertiseFundingMatch(
  faculty,
  scienceCall,
  selectProfileForMatching({
    researcherId: "RS030",
    analysisStatus: "ai_analyzed",
    displayOrigin: "ai",
    displayProfile: profile("RS030", ["air pollution"], {
      research_methods: ["Qualitative Research", "Survey Research"],
      research_domains: ["Development Studies"],
      geographical_focus: ["Thailand"],
    }),
  }),
);
assert.ok(
  genericMatch.relevance.score < 20,
  "generic words such as science, research, development, and Thailand must not inflate relevance",
);

const urlOnlyCall = funding(
  "FD015",
  "ทุนพัฒนานักวิจัยรุ่นใหม่",
  "สมัครออนไลน์ได้ที่: https://research.mis.cmu.ac.th/\n02.-แนบท้ายประกาศ-OUTPUTS-OUTCOME-IMPACT",
);
const urlMatch = assessExpertiseFundingMatch(faculty, urlOnlyCall, analyzed);
assert.ok(urlMatch.relevance.score < 20, "URLs containing research must not create a match");

const insufficient = selectProfileForMatching({
  researcherId: "RS030",
  analysisStatus: "insufficient_evidence",
  displayOrigin: "ai",
  displayProfile: profile("RS030", ["air pollution", "should not be used"]),
});
assert.ok(insufficient.profile, "insufficient-evidence rows still load display_profile but matching must ignore its topics");
const thin = assessExpertiseFundingMatch(faculty, envFunding, insufficient);
assert.equal(thin.evidenceConfidence.source, "titles_only");
assert.ok(thin.evidenceConfidence.score <= 0.4);
assert.ok(thin.relevance.score > 0, "publication titles remain fallback evidence");
assert.ok(
  thin.relevance.evidence.every((item) => item.kind === "publication" || item.kind === "project"),
  "insufficient-evidence matching must not use unverified expertise topics",
);
assert.equal(thin.relevance.basis, "titles");

const approvedSparse = selectProfileForMatching({
  researcherId: "RS010",
  analysisStatus: "approved",
  displayOrigin: "admin",
  displayProfile: profile("RS010", []),
  aiProfile: profile("RS010", ["should not replace approved"]),
});
assert.equal(approvedSparse.verified, true);
assert.deepEqual(approvedSparse.profile?.expertise_profile.primary_expertise, []);
const approvedMatch = assessExpertiseFundingMatch(
  researcher({ researcher_id: "RS010", name_th: "อาจารย์ ดร.พีรพงศ์ จำปี" }),
  envFunding,
  approvedSparse,
);
assert.equal(approvedMatch.evidenceConfidence.source, "approved_profile");
assert.ok(
  !approvedMatch.relevance.evidence.some((item) => item.label === "should not replace approved"),
);

const rejected = selectProfileForMatching({
  researcherId: "RS099",
  analysisStatus: "rejected",
  displayOrigin: "admin",
  displayProfile: profile("RS099", ["air pollution"]),
});
assert.equal(rejected.profile, null);

console.log("matching engine tests passed");
