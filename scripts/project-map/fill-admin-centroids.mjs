/**
 * Fill verified WGS84 points for project-map locations using known
 * amphoe / province / country centroids. Does not invent village coordinates.
 *
 * Usage: npm run project-map:fill-centroids
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

const PROVINCE_CENTROIDS = {
  เชียงใหม่: [18.7883, 98.9853],
  เชียงราย: [19.9072, 99.8308],
  ลำพูน: [18.5744, 99.0089],
  ลำปาง: [18.2923, 99.4928],
  แม่ฮ่องสอน: [19.301, 97.965],
  น่าน: [18.7756, 100.773],
  พะเยา: [19.192, 99.8789],
  แพร่: [18.1445, 100.1403],
  สุโขทัย: [17.0078, 99.823],
  พิษณุโลก: [16.8211, 100.2659],
  อุบลราชธานี: [15.2287, 104.8564],
  เลย: [17.486, 101.7223],
  สงขลา: [7.1756, 100.6147],
  นครปฐม: [13.8199, 100.0621],
  ชัยภูมิ: [15.8067, 102.0317],
  จันทบุรี: [12.6113, 102.1037],
  จันทรบุรี: [12.6113, 102.1037],
  กรุงเทพ: [13.7563, 100.5018],
  กรุงเทพฯ: [13.7563, 100.5018],
  กรุงเทพมหานคร: [13.7563, 100.5018],
  นนทบุรี: [13.8622, 100.5144],
  ปทุมธานี: [14.0208, 100.525],
  สมุทรปราการ: [13.5991, 100.5998],
  สมุทรสาคร: [13.5475, 100.274],
  ฉะเชิงเทรา: [13.6904, 101.077],
  ชลบุรี: [13.3611, 100.9847],
  ระยอง: [12.6814, 101.2812],
  นครราชสีมา: [14.9799, 102.0978],
  หนองคาย: [17.8783, 102.742],
  ยะลา: [6.541, 101.2804],
  สุราษฎร์ธานี: [9.1382, 99.3217],
  สุราษฎร์ธาน: [9.1382, 99.3217],
};

const AMPHOE_CENTROIDS = {
  "เมือง|เชียงใหม่": [18.7883, 98.9853],
  "เชียงดาว|เชียงใหม่": [19.3667, 98.9667],
  "สารภี|เชียงใหม่": [18.6833, 99.0333],
  "ดอยสะเก็ต|เชียงใหม่": [18.8333, 99.1333],
  "แม่ริม|เชียงใหม่": [18.9142, 98.945],
  "แม่วาง|เชียงใหม่": [18.6167, 98.7167],
  "แม่แจ่ม|เชียงใหม่": [18.5, 98.3667],
  "หางดง|เชียงใหม่": [18.685, 98.917],
  "สันทราย|เชียงใหม่": [18.85, 99.05],
  "สันป่าตอง|เชียงใหม่": [18.628, 98.896],
  "แม่แตง|เชียงใหม่": [19.117, 98.95],
  "กัลยาณิวัฒนา|เชียงใหม่": [19.05, 98.3],
  "ออมก๋อย|เชียงใหม่": [17.8, 98.4],
  "จอมทอง|เชียงใหม่": [18.417, 98.683],
  "สะเมิง|เชียงใหม่": [18.85, 98.733],
  "เมือง|ลำพูน": [18.5744, 99.0089],
  "ลี้|ลำพูน": [17.8, 98.95],
  "แม่ทา|ลำพูน": [18.47, 99.14],
  "ขุนยวม|แม่ฮ่องสอน": [19.35, 97.933],
  "แม่สะเรียง|แม่ฮ่องสอน": [18.167, 97.933],
  "ปางมะผ้า|แม่ฮ่องสอน": [19.517, 98.25],
  "เขมราฐ|อุบลราชธานี": [16.033, 105.2],
  "ปากชม|เลย": [18.017, 101.9],
  "ท่าวังผา|น่าน": [19.117, 100.817],
  "เวียงสา|น่าน": [18.567, 100.75],
  "เมือง|ลำปาง": [18.2923, 99.4928],
  "งาว|ลำปาง": [18.75, 99.95],
  "แม่เมาะ|ลำปาง": [18.267, 99.65],
  "เมือง|สงขลา": [7.1988, 100.5951],
  "เมือง|ชัยภูมิ": [15.807, 102.032],
  "เขาคิชฌกูฏ|จันทบุรี": [12.833, 102.117],
  "เขาคิชฌกูฏ|จันทรบุรี": [12.833, 102.117],
  "เวียงป่าเป้า|เชียงราย": [19.35, 99.5],
  "แม่สรวย|เชียงราย": [19.65, 99.55],
  "เมืองเชียงราย|เชียงราย": [19.907, 99.831],
  "แม่จริม|น่าน": [18.5, 101],
  "สวรรคโลก|สุโขทัย": [17.317, 99.833],
  "ทุ่งเสลี่ยม|สุโขทัย": [17.25, 99.583],
};

const COUNTRY_CENTROIDS = {
  ลาว: [17.9757, 102.6331],
  "สปป.ลาว": [17.9757, 102.6331],
  พม่า: [19.7633, 96.0785],
  เมียนมา: [19.7633, 96.0785],
  เมียนมาร์: [19.7633, 96.0785],
  จีน: [35.8617, 104.1954],
  อินเดีย: [20.5937, 78.9629],
  กัมพูชา: [11.5564, 104.9282],
  เวียดนาม: [21.0278, 105.8342],
  มาเลเซีย: [3.139, 101.6869],
  สิงคโปร์: [1.3521, 103.8198],
  ไต้หวัน: [25.033, 121.5654],
  ญี่ปุ่น: [35.6762, 139.6503],
  สหราชอาณาจักร: [51.5074, -0.1278],
  "สหราชอาณาจักร(uk)": [51.5074, -0.1278],
  uk: [51.5074, -0.1278],
};

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
  return String(value ?? "").trim();
}

function splitTokens(value) {
  return [...new Set(
    text(value)
      .split(/[,/;|]+/)
      .map((part) => part.trim())
      .filter(Boolean),
  )];
}

function normalizeAmphoe(value) {
  return text(value).replace(/^อำเภอ/, "").replace(/^เขต/, "").trim();
}

function isThaiCountry(token) {
  const normalized = token.toLowerCase().replace(/\s+/g, "");
  return normalized === "ไทย" || normalized === "ประเทศไทย" || normalized.includes("thai");
}

function resolvePoint(location) {
  const amphoes = splitTokens(location.amphoe).map(normalizeAmphoe);
  const provinces = splitTokens(location.province);
  const countries = splitTokens(location.country);

  if (amphoes.length === 1 && provinces.length === 1) {
    const key = `${amphoes[0]}|${provinces[0]}`;
    if (AMPHOE_CENTROIDS[key]) {
      return { point: AMPHOE_CENTROIDS[key], source: `amphoe-centroid:${key}` };
    }
  }

  if (provinces.length === 1 && PROVINCE_CENTROIDS[provinces[0]]) {
    return { point: PROVINCE_CENTROIDS[provinces[0]], source: `province-centroid:${provinces[0]}` };
  }

  if (provinces.length > 1) {
    const firstKnown = provinces.find((province) => PROVINCE_CENTROIDS[province]);
    if (firstKnown) {
      return { point: PROVINCE_CENTROIDS[firstKnown], source: `province-centroid-first:${firstKnown}` };
    }
  }

  const foreign = countries.filter((country) => !isThaiCountry(country));
  if (foreign.length === 1) {
    const key = foreign[0].toLowerCase().replace(/\s+/g, "");
    const match = Object.keys(COUNTRY_CENTROIDS).find(
      (name) => name.toLowerCase().replace(/\s+/g, "") === key,
    );
    if (match) {
      return { point: COUNTRY_CENTROIDS[match], source: `country-centroid:${match}` };
    }
  }

  if (foreign.length > 1) {
    const firstKnown = foreign.find((country) => {
      const key = country.toLowerCase().replace(/\s+/g, "");
      return Object.keys(COUNTRY_CENTROIDS).some(
        (name) => name.toLowerCase().replace(/\s+/g, "") === key,
      );
    });
    if (firstKnown) {
      const match = Object.keys(COUNTRY_CENTROIDS).find(
        (name) => name.toLowerCase().replace(/\s+/g, "") === firstKnown.toLowerCase().replace(/\s+/g, ""),
      );
      return { point: COUNTRY_CENTROIDS[match], source: `country-centroid-first:${match}` };
    }
  }

  return null;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const env = loadEnv(ENV_PATH);
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: locations, error } = await client
    .from("map_research_locations")
    .select("location_id, area_name, tambon, amphoe, province, country");
  if (error) throw new Error(error.message);

  const now = new Date().toISOString();
  const rows = [];
  let filled = 0;
  let skipped = 0;

  for (const location of locations ?? []) {
    const resolved = resolvePoint(location);
    if (!resolved) {
      skipped += 1;
      continue;
    }
    const [latitude, longitude] = resolved.point;
    filled += 1;
    rows.push({
      location_id: location.location_id,
      geometry_type: "Point",
      latitude,
      longitude,
      geojson: { type: "Point", coordinates: [longitude, latitude] },
      coordinate_source: resolved.source,
      verification_status: "verified",
      verified_at: now,
      verified_by: "admin-centroid-fill",
      updated_at: now,
    });
  }

  for (const batch of chunk(rows, 200)) {
    const { error: upsertError } = await client
      .from("map_location_geometries")
      .upsert(batch, { onConflict: "location_id" });
    if (upsertError) throw new Error(upsertError.message);
  }

  console.log(`Filled centroids: ${filled}`);
  console.log(`Skipped (no clear admin unit): ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
