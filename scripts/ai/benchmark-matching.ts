/**
 * Phase B old-vs-new matching benchmark.
 * Does not write researcher or funding records.
 *
 * Usage: npm run matching:benchmark
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { computeFundingFit } from "@/lib/ai/intelligence/funding-fit";
import { normalizeText } from "@/lib/ai/researcher-meta";
import type { FundingRecord, ResearcherRecord } from "@/lib/assistant-dataset";
import { assessExpertiseFundingMatch } from "@/lib/matching/engine";
import { selectProfileForMatching } from "@/lib/matching/profile";
import type { MatchingProfileRecord } from "@/lib/matching/types";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");
const PREFERRED_FUNDING_IDS = [
  "FD001",
  "FD002",
  "FD004",
  "FD007",
  "FD015",
  "FD016",
  "FD023",
  "FD025",
  "FD026",
];
const PREFERRED_RESEARCHER_IDS = ["RS030", "RS002", "RS007", "RS010", "RS011"];

function loadEnv() {
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function truncate(value: string, max = 140) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function detailsQuality(details: string | null | undefined) {
  const text = (details ?? "").trim();
  if (!text || text === "-") return "empty";
  if (text.length < 80) return "thin";
  return "present";
}

function hasTopicLines(details: string | null | undefined) {
  return /กลุ่มเรื่อง|แผนงานย่อย/.test(details ?? "");
}

function hasEligibilityText(details: string | null | undefined) {
  return /(คุณสมบัติ|ผู้สมัคร|คณาจารย์|eligible|นักศึกษา|มหาบัณฑิต)/i.test(details ?? "");
}

function hasApplicantCategory(details: string | null | undefined) {
  return /(คณาจารย์|อาจารย์รุ่นเยาว์|นักศึกษา|มหาบัณฑิต|postdoctoral|ป\.เอก)/i.test(details ?? "");
}

function hasDeadline(openDate: string | null | undefined, closeDate: string | null | undefined) {
  const open = (openDate ?? "").trim();
  const close = (closeDate ?? "").trim();
  return Boolean(open) && Boolean(close) && open !== "-" && close !== "-";
}

function fundingPriority(row: {
  details: string | null;
  open_date: string;
  close_date: string;
  source_url: string | null;
}, attachmentCount: number) {
  const quality = detailsQuality(row.details);
  if (quality === "empty" && attachmentCount > 0) return "P0";
  if (quality === "empty") return "P0";
  if (!hasEligibilityText(row.details) && !hasApplicantCategory(row.details)) return "P1";
  if (attachmentCount > 0 && !hasEligibilityText(row.details)) return "P1";
  if (!hasTopicLines(row.details) && !hasApplicantCategory(row.details)) return "P2";
  if (attachmentCount > 0) return "P2";
  return "P3";
}

function humanReview(row: {
  eligibility: string;
  relevance: number;
  fitScore: number;
  confidenceSource: string;
  basis: string;
}) {
  if (row.eligibility === "needs_review") return "ตรวจคุณสมบัติในประกาศก่อนใช้ผล";
  if (row.eligibility === "insufficient_call_data") return "เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์";
  if (row.confidenceSource === "titles_only" || row.basis === "titles") {
    return "ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว";
  }
  if (row.fitScore >= 80 && row.relevance <= 15) {
    return "Fit Score เดิมสูงจากคำทั่วไป — อย่าสลับอันดับจนกว่าจะตรวจหลักฐาน";
  }
  if (row.eligibility === "likely_ineligible" && row.relevance >= 40) {
    return "งานวิจัยสอดคล้องแต่สิทธิ์ตามประกาศไม่ผ่าน — แสดงทั้งสองค่า";
  }
  return "ใช้เป็นคำอธิบายประกอบ Fit Score ได้";
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local");

  const supabase = createClient(url, key);

  const [fundingsResult, profilesResult, researchersResult] = await Promise.all([
    supabase
      .from("fundings")
      .select(
        "funding_id, title, organization, status_label, open_date, close_date, published_date, details, source_url",
      )
      .order("funding_id"),
    supabase
      .from("researcher_expertise_profiles")
      .select("researcher_id, analysis_status, display_origin, display_profile, ai_profile"),
    supabase
      .from("researchers")
      .select("researcher_id, name_th, name_en, department, email_raw, scholarly_output, citations, h_index")
      .order("researcher_id"),
  ]);

  if (fundingsResult.error) throw new Error(fundingsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (researchersResult.error) throw new Error(researchersResult.error.message);

  const allFundings = asRows<{
    funding_id: string;
    title: string;
    organization: string;
    status_label: string;
    open_date: string;
    close_date: string;
    published_date: string;
    details: string | null;
    source_url: string | null;
  }>(fundingsResult.data);
  const allProfiles = asRows<{
    researcher_id: string;
    analysis_status: string | null;
    display_origin: string | null;
    display_profile: unknown;
    ai_profile: unknown;
  }>(profilesResult.data);
  const allResearchers = asRows<{
    researcher_id: string;
    name_th: string;
    name_en: string | null;
    department: string;
    email_raw: string | null;
    scholarly_output: number | null;
    citations: number | null;
    h_index: number | null;
  }>(researchersResult.data);

  const attachmentsResult = await supabase.from("funding_attachments").select("funding_id");
  if (attachmentsResult.error) throw new Error(attachmentsResult.error.message);
  const attachmentCounts = new Map<string, number>();
  for (const row of asRows<{ funding_id: string }>(attachmentsResult.data)) {
    attachmentCounts.set(row.funding_id, (attachmentCounts.get(row.funding_id) ?? 0) + 1);
  }

  const availableFundingIds = new Set(allFundings.map((row) => row.funding_id));
  let selectedFundingIds = PREFERRED_FUNDING_IDS.filter((id) => availableFundingIds.has(id));
  if (selectedFundingIds.length < 8) {
    const extras = allFundings
      .map((row) => row.funding_id)
      .filter((id) => !selectedFundingIds.includes(id))
      .slice(0, 8 - selectedFundingIds.length);
    selectedFundingIds = [...selectedFundingIds, ...extras];
  }

  const availableResearcherIds = new Set(allResearchers.map((row) => row.researcher_id));
  let selectedResearcherIds = PREFERRED_RESEARCHER_IDS.filter((id) => availableResearcherIds.has(id));
  if (selectedResearcherIds.length < 5) {
    const extras = allResearchers
      .map((row) => row.researcher_id)
      .filter((id) => !selectedResearcherIds.includes(id))
      .slice(0, 5 - selectedResearcherIds.length);
    selectedResearcherIds = [...selectedResearcherIds, ...extras];
  }
  const insufficientIds = allProfiles
    .filter(
      (row) =>
        row.analysis_status === "insufficient_evidence" &&
        availableResearcherIds.has(row.researcher_id) &&
        !selectedResearcherIds.includes(row.researcher_id),
    )
    .map((row) => row.researcher_id)
    .slice(0, 2);
  const loadedResearcherIds = [...new Set([...selectedResearcherIds, ...insufficientIds])];

  const [keywordsResult, expertiseResult, degreesResult, publicationsResult, projectsResult] =
    await Promise.all([
      supabase
        .from("researcher_keywords")
        .select("researcher_id, keyword_type, keyword_order, keyword")
        .in("researcher_id", loadedResearcherIds),
      supabase
        .from("researcher_expertise")
        .select("researcher_id, expertise_order, expertise")
        .in("researcher_id", loadedResearcherIds),
      supabase
        .from("researcher_degrees")
        .select("researcher_id, degree_order, degree_text")
        .in("researcher_id", loadedResearcherIds),
      supabase
        .from("publications")
        .select("researcher_id, title, year")
        .in("researcher_id", loadedResearcherIds),
      supabase
        .from("researcher_projects")
        .select("researcher_id, project_name, role_label, fiscal_year_be")
        .in("researcher_id", loadedResearcherIds),
    ]);

  for (const result of [keywordsResult, expertiseResult, degreesResult, publicationsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const group = <T extends { researcher_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const list = map.get(row.researcher_id) ?? [];
      list.push(row);
      map.set(row.researcher_id, list);
    }
    return map;
  };

  const keywordsById = group(
    asRows<{ researcher_id: string; keyword_type: string; keyword_order: number | null; keyword: string }>(
      keywordsResult.data,
    ),
  );
  const expertiseById = group(
    asRows<{ researcher_id: string; expertise_order: number | null; expertise: string }>(expertiseResult.data),
  );
  const degreesById = group(
    asRows<{ researcher_id: string; degree_order: number | null; degree_text: string }>(degreesResult.data),
  );
  const publicationsById = group(
    asRows<{ researcher_id: string; title: string; year: number | null }>(publicationsResult.data),
  );
  const projectsById = group(
    asRows<{
      researcher_id: string;
      project_name: string;
      role_label: string | null;
      fiscal_year_be: number | null;
    }>(projectsResult.error ? [] : projectsResult.data),
  );

  const researcherRecords = new Map<string, ResearcherRecord>();
  for (const row of allResearchers.filter((item) => loadedResearcherIds.includes(item.researcher_id))) {
    const keywords = keywordsById.get(row.researcher_id) ?? [];
    const expertise = expertiseById.get(row.researcher_id) ?? [];
    const degrees = degreesById.get(row.researcher_id) ?? [];
    const publications = publicationsById.get(row.researcher_id) ?? [];
    const projects = projectsById.get(row.researcher_id) ?? [];
    researcherRecords.set(row.researcher_id, {
      row,
      keywords,
      expertise,
      degrees,
      publications,
      collaborations: [],
      projects,
      searchText: normalizeText(
        [
          row.name_th,
          row.name_en ?? "",
          row.department,
          ...keywords.map((item) => item.keyword),
          ...expertise.map((item) => item.expertise),
          ...degrees.map((item) => item.degree_text),
          ...publications.map((item) => item.title),
          ...projects.map((item) => item.project_name),
        ].join(" "),
      ),
    });
  }

  const fundingRecords = new Map<string, FundingRecord>();
  for (const row of allFundings.filter((item) => selectedFundingIds.includes(item.funding_id))) {
    fundingRecords.set(row.funding_id, {
      row: {
        ...row,
        details: row.details ?? "",
      },
      attachments: [],
      searchText: normalizeText(
        [row.title, row.organization, row.status_label, row.open_date, row.close_date, row.details ?? ""].join(
          " ",
        ),
      ),
    });
  }

  const matchingProfiles = new Map<string, MatchingProfileRecord>();
  for (const id of loadedResearcherIds) {
    const row = allProfiles.find((item) => item.researcher_id === id);
    matchingProfiles.set(
      id,
      selectProfileForMatching({
        researcherId: id,
        analysisStatus: row?.analysis_status,
        displayOrigin: row?.display_origin,
        displayProfile: row?.display_profile,
        aiProfile: row?.ai_profile,
      }),
    );
  }

  const statusCounts = new Map<string, number>();
  for (const row of allProfiles) {
    const status = row.analysis_status ?? "missing";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const emptyDetails = allFundings.filter((row) => detailsQuality(row.details) === "empty");
  const thinDetails = allFundings.filter((row) => detailsQuality(row.details) === "thin");
  const withTopics = allFundings.filter((row) => /กลุ่มเรื่อง/.test(row.details ?? ""));
  const withEligibility = allFundings.filter((row) =>
    /(คุณสมบัติ|ผู้สมัคร|คณาจารย์|eligible)/i.test(row.details ?? ""),
  );
  const missingSource = allFundings.filter((row) => !row.source_url);

  const comparisons: Array<{
    researcherId: string;
    researcherName: string;
    profileStatus: string;
    verified: boolean;
    fundingId: string;
    fundingTitle: string;
    oldRank: number;
    newRank: number;
    fitScore: number;
    oldReasons: string[];
    relevance: number;
    confidence: number;
    confidenceSource: string;
    eligibility: string;
    eligibilitySummary: string;
    quotedRequirement: string;
    researcherFacts: string[];
    basis: string;
    reviewReasons: string[];
    evidence: string[];
  }> = [];

  for (const researcherId of selectedResearcherIds) {
    const researcher = researcherRecords.get(researcherId);
    const matchingProfile = matchingProfiles.get(researcherId);
    if (!researcher || !matchingProfile) continue;

    const oldRanked = selectedFundingIds
      .map((fundingId) => {
        const funding = fundingRecords.get(fundingId);
        if (!funding) return null;
        return computeFundingFit(researcher, funding);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.fitScore - a.fitScore);

    const newRanked = selectedFundingIds
      .map((fundingId) => {
        const funding = fundingRecords.get(fundingId);
        if (!funding) return null;
        return assessExpertiseFundingMatch(researcher, funding, matchingProfile);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.relevance.score - a.relevance.score);

    const oldRankById = new Map(oldRanked.map((item, index) => [item.fundingId, index + 1]));
    const newRankById = new Map(newRanked.map((item, index) => [item.fundingId, index + 1]));

    for (const fundingId of selectedFundingIds) {
      const funding = fundingRecords.get(fundingId);
      if (!funding) continue;
      const oldFit = oldRanked.find((item) => item.fundingId === fundingId);
      const phaseB = newRanked.find((item) => item.fundingId === fundingId);
      if (!oldFit || !phaseB) continue;
      comparisons.push({
        researcherId,
        researcherName: researcher.row.name_th,
        profileStatus: matchingProfile.analysisStatus,
        verified: matchingProfile.verified,
        fundingId,
        fundingTitle: funding.row.title,
        oldRank: oldRankById.get(fundingId) ?? 0,
        newRank: newRankById.get(fundingId) ?? 0,
        fitScore: oldFit.fitScore,
        oldReasons: oldFit.reasons,
        relevance: phaseB.relevance.score,
        confidence: phaseB.evidenceConfidence.score,
        confidenceSource: phaseB.evidenceConfidence.source,
        eligibility: phaseB.eligibility.status,
        eligibilitySummary: phaseB.eligibility.summary,
        quotedRequirement: phaseB.eligibility.quotedRequirements[0] ?? "",
        researcherFacts: phaseB.eligibility.researcherFactsUsed,
        basis: phaseB.relevance.basis,
        reviewReasons: phaseB.eligibility.reviewReasons,
        evidence: phaseB.relevance.evidence.slice(0, 4).map((item) => item.label),
      });
    }
  }

  const supplement: typeof comparisons = [];
  for (const researcherId of insufficientIds) {
    const researcher = researcherRecords.get(researcherId);
    const matchingProfile = matchingProfiles.get(researcherId);
    if (!researcher || !matchingProfile) continue;
    const oldRanked = selectedFundingIds
      .map((fundingId) => {
        const funding = fundingRecords.get(fundingId);
        if (!funding) return null;
        return computeFundingFit(researcher, funding);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.fitScore - a.fitScore);
    const newRanked = selectedFundingIds
      .map((fundingId) => {
        const funding = fundingRecords.get(fundingId);
        if (!funding) return null;
        return assessExpertiseFundingMatch(researcher, funding, matchingProfile);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.relevance.score - a.relevance.score);
    const oldRankById = new Map(oldRanked.map((item, index) => [item.fundingId, index + 1]));
    const newRankById = new Map(newRanked.map((item, index) => [item.fundingId, index + 1]));
    for (const fundingId of selectedFundingIds) {
      const funding = fundingRecords.get(fundingId);
      if (!funding) continue;
      const oldFit = oldRanked.find((item) => item.fundingId === fundingId);
      const phaseB = newRanked.find((item) => item.fundingId === fundingId);
      if (!oldFit || !phaseB) continue;
      supplement.push({
        researcherId,
        researcherName: researcher.row.name_th,
        profileStatus: matchingProfile.analysisStatus,
        verified: matchingProfile.verified,
        fundingId,
        fundingTitle: funding.row.title,
        oldRank: oldRankById.get(fundingId) ?? 0,
        newRank: newRankById.get(fundingId) ?? 0,
        fitScore: oldFit.fitScore,
        oldReasons: oldFit.reasons,
        relevance: phaseB.relevance.score,
        confidence: phaseB.evidenceConfidence.score,
        confidenceSource: phaseB.evidenceConfidence.source,
        eligibility: phaseB.eligibility.status,
        eligibilitySummary: phaseB.eligibility.summary,
        quotedRequirement: phaseB.eligibility.quotedRequirements[0] ?? "",
        researcherFacts: phaseB.eligibility.researcherFactsUsed,
        basis: phaseB.relevance.basis,
        reviewReasons: phaseB.eligibility.reviewReasons,
        evidence: phaseB.relevance.evidence.slice(0, 4).map((item) => item.label),
      });
    }
  }

  const rankChanges = comparisons.filter((item) => item.oldRank !== item.newRank).length;
  const sameTop1 = selectedResearcherIds.filter((researcherId) => {
    const rows = comparisons.filter((item) => item.researcherId === researcherId);
    const oldTop = rows.find((item) => item.oldRank === 1);
    const newTop = rows.find((item) => item.newRank === 1);
    return oldTop && newTop && oldTop.fundingId === newTop.fundingId;
  }).length;

  const lines: string[] = [];
  const push = (line = "") => lines.push(line);

  push("# Phase B.1 matching benchmark");
  push("");
  push(`Generated: ${new Date().toISOString()}`);
  push("Scope: live Supabase records. No researcher or funding rows were written.");
  push("The production ranker remains `computeFundingFit` in `src/lib/ai/intelligence/funding-fit.ts`.");
  push("Calibration goal: better semantic relevance and evidence, not preserving legacy rankings.");
  push("");
  push("## Funding inventory");
  push("");
  push(`- Fundings in database: ${allFundings.length}`);
  push(`- Empty or placeholder details (\`-\`): ${emptyDetails.length} (${emptyDetails.map((row) => row.funding_id).join(", ") || "none"})`);
  push(`- Thin details (< 80 characters): ${thinDetails.length}`);
  push(`- Records with กลุ่มเรื่อง lines: ${withTopics.length}`);
  push(`- Records with applicant/eligibility wording: ${withEligibility.length}`);
  push(`- Missing source_url: ${missingSource.length}`);
  push(`- Benchmark set: ${selectedFundingIds.join(", ")}`);
  push("");
  push("| ID | Organization | Details | กลุ่มเรื่อง | Eligibility text | Attachments | Title |");
  push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const id of selectedFundingIds) {
    const row = allFundings.find((item) => item.funding_id === id);
    if (!row) continue;
    push(
      `| ${row.funding_id} | ${row.organization} | ${detailsQuality(row.details)} (${(row.details ?? "").length} chars) | ${/กลุ่มเรื่อง/.test(row.details ?? "") ? "yes" : "no"} | ${/(คุณสมบัติ|ผู้สมัคร|คณาจารย์|eligible)/i.test(row.details ?? "") ? "yes" : "no"} | ${attachmentCounts.get(row.funding_id) ?? 0} | ${truncate(row.title, 80)} |`,
    );
  }
  push("");
  push("## Researcher profiles used");
  push("");
  push(`- Profiles in database: ${allProfiles.length}`);
  push(
    `- Status counts: ${[...statusCounts.entries()].map(([status, count]) => `${status}=${count}`).join(", ") || "none"}`,
  );
  push("");
  push("| ID | Name | Status | Verified | Primary topics | Publications | Projects |");
  push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const id of selectedResearcherIds) {
    const researcher = researcherRecords.get(id);
    const profile = matchingProfiles.get(id);
    const topics = profile?.profile?.expertise_profile.primary_expertise.map((item) => item.topic) ?? [];
    push(
      `| ${id} | ${researcher?.row.name_th ?? "missing"} | ${profile?.analysisStatus ?? "missing"} | ${profile?.verified ? "yes" : "no"} | ${topics.slice(0, 4).join("; ") || "—"} | ${researcher?.publications.length ?? 0} | ${researcher?.projects.length ?? 0} |`,
    );
  }
  push("");
  push("## Ranking comparison");
  push("");
  push(`- Researcher–funding pairs scored: ${comparisons.length}`);
  push(`- Pairs whose rank changed: ${rankChanges}`);
  push(`- Researchers with the same top-1 funding: ${sameTop1}/${selectedResearcherIds.length}`);
  push("");

  for (const researcherId of selectedResearcherIds) {
    const rows = comparisons
      .filter((item) => item.researcherId === researcherId)
      .sort((a, b) => a.oldRank - b.oldRank);
    const sample = rows[0];
    if (!sample) continue;
    push(`### ${sample.researcherId} ${sample.researcherName}`);
    push("");
    push(`Profile: \`${sample.profileStatus}\`${sample.verified ? ", verified/admin-locked" : ""}`);
    push("");
    push("| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |");
    push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const row of rows) {
      push(
        `| ${row.oldRank} | ${row.newRank} | ${row.fundingId} ${truncate(row.fundingTitle, 42)} | ${row.fitScore} | ${row.relevance} | ${row.basis} | ${row.confidence} (${row.confidenceSource}) | ${row.eligibility} | ${row.evidence.join("; ") || "—"} | ${humanReview(row)} |`,
      );
    }
    push("");
    push("Old Fit Score reasons (top 3):");
    push("");
    for (const row of rows.slice(0, 3)) {
      push(`- ${row.fundingId}: ${row.oldReasons.join("; ")}`);
    }
    push("");
    push("Eligibility notes:");
    push("");
    for (const row of rows) {
      if (row.eligibility === "unknown" && rows.every((item) => item.eligibility === "unknown")) continue;
      push(`- ${row.fundingId}: ${row.eligibility} — ${row.eligibilitySummary}`);
    }
    if (rows.every((item) => item.eligibility === "unknown")) {
      push("- All selected calls in this set stayed `unknown` because applicant requirements were not extractable from the stored details.");
    }
    push("");
  }

    push("## Insufficient-evidence fallback");
  push("");
  if (!insufficientIds.length) {
    push("No additional `insufficient_evidence` researchers were available outside the core five.");
    push("");
  } else {
    push(
      `The core five researchers are unchanged. These extra rows confirm that \`insufficient_evidence\` profiles are still scored from titles/projects and are not excluded: ${insufficientIds.join(", ")}.`,
    );
    push("");
    for (const researcherId of insufficientIds) {
      const rows = supplement
        .filter((item) => item.researcherId === researcherId)
        .sort((a, b) => a.newRank - b.newRank);
      const sample = rows[0];
      if (!sample) continue;
      const record = researcherRecords.get(researcherId);
      push(`### ${sample.researcherId} ${sample.researcherName}`);
      push("");
      push(
        `Status: \`insufficient_evidence\`. Publications: ${record?.publications.length ?? 0}. Projects: ${record?.projects.length ?? 0}.`,
      );
      push("");
      push("| Funding | Fit Score | Relevance | Basis | Confidence | Eligibility | Evidence |");
      push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const row of rows.slice(0, 5)) {
        push(
          `| ${row.fundingId} | ${row.fitScore} | ${row.relevance} | ${row.basis} | ${row.confidence} (${row.confidenceSource}) | ${row.eligibility} | ${row.evidence.join("; ") || "—"} |`,
        );
      }
      push("");
    }
  }

  push("## Differences");
  push("");
  push("- Fit Score still uses a +20 baseline and scholarly-output boost, so generic overlap can rank first.");
  push("- Phase B.1 Relevance requires distinctive tokens; `research`, `science`, `development`, `Thailand`, and host-city geography no longer count by themselves.");
  push("- Evidence Confidence stays separate. Title-only matches are labelled `titles_only`.");
  push("- Eligibility quotes call text and researcher facts. Missing data is `unknown` or `insufficient_call_data`, never ineligible. Mixed student/faculty wording is `needs_review`.");
  push("- Approved/admin-locked profiles still read `display_profile` only.");
  push("");
  push("## Recommendation");
  push("");
  push("- Keep `computeFundingFit` as the Smart Match ranking until this B.1 table is reviewed.");
  push("- Prefer Phase B Relevance and evidence when Fit Score is high but basis is `none` or evidence is generic.");
  push("- Fill P0/P1 funding records in `docs/phase-b1-funding-data-quality.md` before Phase C ranking changes.");
  push("");

  const markdown = lines.join("\n");
  const outPath = path.join(ROOT, "docs", "phase-b-matching-benchmark.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, markdown, "utf8");

  const quality: string[] = [];
  const q = (line = "") => quality.push(line);
  const prioritized = [...allFundings].sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const pa = fundingPriority(a, attachmentCounts.get(a.funding_id) ?? 0);
    const pb = fundingPriority(b, attachmentCounts.get(b.funding_id) ?? 0);
    return order[pa] - order[pb] || a.funding_id.localeCompare(b.funding_id);
  });
  q("# Phase B.1 funding data-quality audit");
  q("");
  q(`Generated: ${new Date().toISOString()}`);
  q("No funding rows were invented or updated. This report only flags missing or unusable stored fields.");
  q("");
  q("## Summary");
  q("");
  q(`- Records: ${allFundings.length}`);
  q(`- Missing or placeholder details: ${emptyDetails.length}`);
  q(`- Missing eligibility wording in details: ${allFundings.filter((row) => !hasEligibilityText(row.details)).length}`);
  q(`- Missing applicant category: ${allFundings.filter((row) => !hasApplicantCategory(row.details)).length}`);
  q(`- Missing topic lines (กลุ่มเรื่อง/แผนงานย่อย): ${allFundings.filter((row) => !hasTopicLines(row.details)).length}`);
  q(`- Missing deadline pair: ${allFundings.filter((row) => !hasDeadline(row.open_date, row.close_date)).length}`);
  q(`- Attachments present but attachment text is not parsed: ${allFundings.filter((row) => (attachmentCounts.get(row.funding_id) ?? 0) > 0).length}`);
  q("");
  q("Priority: **P0** fill empty details (especially when a PDF exists). **P1** add applicant/eligibility text. **P2** parse existing attachments or add กลุ่มเรื่อง. **P3** complete enough for matching explanations.");
  q("");
  q("| Priority | ID | Details | Eligibility text | Applicant category | Topic lines | Deadlines | Attachments (unread) | Issue |");
  q("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of prioritized) {
    const attachments = attachmentCounts.get(row.funding_id) ?? 0;
    const priority = fundingPriority(row, attachments);
    const issues: string[] = [];
    if (detailsQuality(row.details) === "empty") issues.push("no call description");
    if (!hasEligibilityText(row.details)) issues.push("no eligibility wording");
    if (!hasApplicantCategory(row.details)) issues.push("no applicant category");
    if (!hasTopicLines(row.details)) issues.push("no กลุ่มเรื่อง");
    if (!hasDeadline(row.open_date, row.close_date)) issues.push("deadline incomplete");
    if (attachments > 0) issues.push("attachment text not extracted");
    if (!issues.length) issues.push("usable stored details");
    q(
      `| ${priority} | ${row.funding_id} | ${detailsQuality(row.details)} (${(row.details ?? "").length}) | ${hasEligibilityText(row.details) ? "yes" : "no"} | ${hasApplicantCategory(row.details) ? "yes" : "no"} | ${hasTopicLines(row.details) ? "yes" : "no"} | ${hasDeadline(row.open_date, row.close_date) ? "yes" : "no"} | ${attachments} | ${issues.join("; ")} |`,
    );
  }
  q("");
  q("## Recommended correction order");
  q("");
  q("1. P0 records with attachments: copy eligibility and topic text from the already-uploaded PDF into `details`. Do not crawl.");
  q("2. P1 วช. calls that have กลุ่มเรื่อง but no applicant category: add who may apply, or explicitly mark unknown.");
  q("3. P2 fellowships/personnel funds: keep narrative details, add a structured applicant field in Phase C.");
  q("4. Do not fill missing fields with inferred research themes.");
  q("");
  const qualityPath = path.join(ROOT, "docs", "phase-b1-funding-data-quality.md");
  fs.writeFileSync(qualityPath, quality.join("\n"), "utf8");
  process.stdout.write(markdown);
  process.stdout.write(`\nWrote ${outPath}\nWrote ${qualityPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
