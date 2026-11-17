import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ENV_PATH = path.join(ROOT, ".env.local");

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

const env = loadEnv(ENV_PATH);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

const anon = createClient(url, anonKey);
const service = serviceKey ? createClient(url, serviceKey) : null;

const REQUIRED_TABLES = [
  { name: "researchers", minRows: 1 },
  { name: "researcher_degrees", minRows: 1 },
  { name: "researcher_expertise", minRows: 1 },
  { name: "researcher_keywords", minRows: 1 },
  { name: "researcher_collaborations", minRows: 0 },
  { name: "researcher_projects", minRows: 0 },
  { name: "publications", minRows: 1 },
  { name: "research_news", minRows: 1 },
  { name: "fundings", minRows: 1 },
  { name: "site_page_views", minRows: 1 },
];

const OPTIONAL_TABLES = ["content_views"];

const COLUMN_CHECKS = [
  { table: "research_news", columns: ["image_position"] },
  { table: "researchers", columns: ["image_path", "updated_at", "view_count"] },
];

const BUCKETS = [
  "research-news-images",
  "research-news-documents",
  "researcher-images",
  "funding-images",
  "funding-documents",
];

console.log(`Supabase URL: ${url}\n`);

let issues = 0;

for (const { name, minRows } of REQUIRED_TABLES) {
  const { count, error } = await anon.from(name).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`FAIL  ${name}: ${error.message}`);
    issues += 1;
    continue;
  }
  const ok = (count ?? 0) >= minRows;
  console.log(`${ok ? "OK" : "WARN"}  ${name}: ${count ?? 0} rows`);
  if (!ok) issues += 1;
}

for (const name of OPTIONAL_TABLES) {
  const { count, error } = await anon.from(name).select("*", { count: "exact", head: true });
  console.log(`${error ? "SKIP" : "OK"}  ${name}: ${error ? error.message : `${count ?? 0} rows`}`);
}

console.log("");
for (const { table, columns } of COLUMN_CHECKS) {
  const select = columns.join(",");
  const { error } = await anon.from(table).select(select).limit(1);
  console.log(`${error ? "FAIL" : "OK"}  ${table} (${select}): ${error ? error.message : "present"}`);
  if (error) issues += 1;
}

if (service) {
  console.log("");
  for (const bucket of BUCKETS) {
    const { data, error } = await service.storage.from(bucket).list("", { limit: 100 });
    const count = data?.length ?? 0;
    console.log(`${error ? "FAIL" : count ? "OK" : "WARN"}  bucket ${bucket}: ${error ? error.message : `${count} root items`}`);
    if (error) issues += 1;
  }
} else {
  console.log("\nSKIP  storage audit (SUPABASE_SERVICE_ROLE_KEY not set)");
}

const localPhotos = fs.existsSync(path.join(ROOT, "public", "images", "researchers"))
  ? fs.readdirSync(path.join(ROOT, "public", "images", "researchers")).filter((f) => !f.startsWith(".")).length
  : 0;
console.log(`\nLocal researcher photos: ${localPhotos} files in public/images/researchers`);

console.log(`\n${issues ? `Found ${issues} issue(s) — re-run SQL schemas in supabase/ and redeploy.` : "Restore looks healthy for public site data."}`);
