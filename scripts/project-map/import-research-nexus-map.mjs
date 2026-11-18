/**
 * Import Research Nexus project map Excel into Supabase.
 *
 * Prerequisites:
 * 1. Run supabase/research-project-map-schema.sql in SQL Editor
 * 2. SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage:
 *   npm run project-map:import
 *   PROJECT_MAP_SOURCE="D:\\path\\file.xlsx" npm run project-map:import
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const DEFAULT_SOURCE =
  "C:\\Users\\USER\\Documents\\Codex\\2026-11-18\\j\\outputs\\research_nexus_database\\Research_Nexus_Map_Database.xlsx";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function text(value) {
  if (value == null) return "";
  return String(value).trim();
}

function numberOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function mapVerificationStatus(rawStatus) {
  const status = text(rawStatus);
  if (status.includes("ยืนยัน")) return "verified";
  if (status.includes("ค้นหาไม่สำเร็จ")) return "failed";
  if (status.includes("หลายพื้นที่")) return "multi_area";
  if (status.includes("พื้นที่กว้าง") || status.includes("ไม่ระบุจุด")) return "wide_area";
  if (status.toLowerCase().includes("pending")) return "pending";
  return "pending";
}

function projectIdFromTitle(titleTh) {
  const hash = crypto.createHash("sha1").update(titleTh).digest("hex").slice(0, 12);
  return `PRJ-${hash}`;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function upsertBatches(client, table, rows, onConflict) {
  for (const batch of chunk(rows, 200)) {
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  const env = loadEnv(ENV_PATH);
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  const source = process.env.PROJECT_MAP_SOURCE || DEFAULT_SOURCE;
  if (!fs.existsSync(source)) throw new Error(`Source file not found: ${source}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const workbook = XLSX.readFile(source);
  const locationRows = XLSX.utils.sheet_to_json(workbook.Sheets["รายการพิกัด"], { defval: null });
  const projectRows = XLSX.utils.sheet_to_json(workbook.Sheets["โครงการ_พื้นที่"], { defval: null });

  const locations = locationRows.map((row) => ({
    location_id: text(row.Location_ID),
    area_name: text(row["พื้นที่"]) || null,
    tambon: text(row["ตำบล"]) || null,
    amphoe: text(row["อำเภอ"]) || null,
    province: text(row["จังหวัด"]) || null,
    country: text(row["ประเทศ"]) || null,
    region: null,
    search_query: text(row["คำค้นหาพิกัด"]) || null,
    map_data_type: text(row["ประเภทข้อมูลแผนที่"]) || null,
    coordinate_status: text(row["สถานะพิกัด"]) || null,
    place_lookup_result: text(row["ผลค้นหาสถานที่"]) || null,
    coordinate_source: text(row["แหล่งพิกัด"]) || null,
    map_search_url: text(row["ลิงก์ค้นหาแผนที่"]) || null,
    updated_at: new Date().toISOString(),
  })).filter((row) => row.location_id);

  const projectsById = new Map();
  const links = [];

  for (const row of projectRows) {
    const titleTh = text(row["ชื่อโครงการ"]);
    if (!titleTh) continue;
    const projectId = projectIdFromTitle(titleTh);
    if (!projectsById.has(projectId)) {
      projectsById.set(projectId, {
        project_id: projectId,
        title_th: titleTh,
        title_en: text(row["ชื่อโครงการภาษาอังกฤษ"]) || null,
        fiscal_year_be: numberOrNull(row["ปีงบประมาณ"]),
        sdg: text(row.SDG) || null,
        strategy: text(row["ยุทธศาสตร์"]) || null,
        research_group: text(row["กลุ่มการวิจัย"]) || null,
        research_type: text(row["ประเภทงานวิจัย"]) || null,
        start_year_be: numberOrNull(row["ปีที่เริ่มต้น"]),
        end_year_be: numberOrNull(row["ปีที่สิ้นสุด"]),
        year_count: numberOrNull(row["จำนวนปี"]),
        funding_kind: text(row["ทุนวิจัย"]) || null,
        funding_source: text(row["แหล่งทุน"]) || null,
        principal_investigator: text(row["หัวหน้าโครงการ"]) || null,
        co_investigators: text(row["ผู้ร่วมโครงการ"]) || null,
        updated_at: new Date().toISOString(),
      });
    }

    const locationId = text(row.Location_ID);
    const projectLocationId = text(row.Project_Location_ID);
    if (!locationId || !projectLocationId) continue;

    links.push({
      project_location_id: projectLocationId,
      project_id: projectId,
      location_id: locationId,
      area_name: text(row["พื้นที่"]) || null,
      tambon: text(row["ตำบล"]) || null,
      amphoe: text(row["อำเภอ"]) || null,
      province: text(row["จังหวัด"]) || null,
      country: text(row["ประเทศ"]) || null,
      region: text(row["ภูมิภาค"]) || null,
    });
  }

  const geometries = locationRows.map((row) => {
    const locationId = text(row.Location_ID);
    const verificationStatus = mapVerificationStatus(row["สถานะพิกัด"]);
    const latitude = numberOrNull(row["ละติจูด"]);
    const longitude = numberOrNull(row["ลองจิจูด"]);
    const hasVerifiedPoint =
      verificationStatus === "verified" &&
      isValidLatitude(latitude) &&
      isValidLongitude(longitude);

    return {
      location_id: locationId,
      geometry_type: hasVerifiedPoint ? "Point" : null,
      latitude: hasVerifiedPoint ? latitude : null,
      longitude: hasVerifiedPoint ? longitude : null,
      geojson: hasVerifiedPoint
        ? { type: "Point", coordinates: [longitude, latitude] }
        : null,
      coordinate_source: text(row["แหล่งพิกัด"]) || null,
      verification_status: verificationStatus,
      verified_at: hasVerifiedPoint ? new Date().toISOString() : null,
      verified_by: hasVerifiedPoint ? "excel-import" : null,
      updated_at: new Date().toISOString(),
    };
  }).filter((row) => row.location_id);

  console.log(`Locations: ${locations.length}`);
  console.log(`Projects: ${projectsById.size}`);
  console.log(`Project-location links: ${links.length}`);
  console.log(
    `Verified mappable points: ${geometries.filter((item) => item.geometry_type === "Point").length}`,
  );

  await upsertBatches(client, "map_research_locations", locations, "location_id");
  await upsertBatches(client, "map_research_projects", [...projectsById.values()], "project_id");
  await upsertBatches(client, "map_research_project_locations", links, "project_location_id");
  await upsertBatches(client, "map_location_geometries", geometries, "location_id");

  console.log("Import complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
