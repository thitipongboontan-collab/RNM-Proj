/**
 * One-time admin setup: storage buckets + env hints.
 * Usage: node scripts/admin/setup-admin.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(".env.local not found");
  }

  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function upsertEnvKey(key, value) {
  const lines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)
    : [];
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  fs.writeFileSync(ENV_PATH, `${next.filter((line, index, arr) => line.length || index < arr.length - 1).join("\n")}\n`);
}

async function ensureBuckets(supabase) {
  for (const bucket of [
    "funding-images",
    "funding-documents",
    "research-news-images",
    "research-news-documents",
    "researcher-images",
  ]) {
    const { data: existing } = await supabase.storage.getBucket(bucket);
    if (existing) {
      console.log(`✓ bucket exists: ${bucket}`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error) throw new Error(`Failed to create bucket ${bucket}: ${error.message}`);
    console.log(`✓ created bucket: ${bucket}`);
  }
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 20 });
  if (error) throw new Error(`Failed to list auth users: ${error.message}`);

  const users = data.users ?? [];
  if (!users.length) {
    console.log("⚠ No Supabase Auth users found.");
    console.log("  Create one in Dashboard → Authentication → Users → Add user");
    return;
  }

  const primary = users[0];
  if (!env.ADMIN_EMAIL) {
    upsertEnvKey("ADMIN_EMAIL", primary.email ?? "");
    console.log(`✓ set ADMIN_EMAIL=${primary.email}`);
  } else {
    console.log(`✓ ADMIN_EMAIL already set (${env.ADMIN_EMAIL})`);
  }

  await ensureBuckets(supabase);

  console.log("\nNext steps:");
  console.log("1. Restart dev server: npm run dev");
  console.log("2. Login at /admin/login");
  console.log("3. Add ADMIN_EMAIL to Vercel production env if deploying");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
