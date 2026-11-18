/**
 * Extract text from existing funding PDF/DOC attachments.
 * Prerequisites:
 * 1. Run supabase/funding-attachment-text-schema.sql
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run funding:extract-attachments
 */

import fs from "node:fs";
import path from "node:path";
import { extractPendingFundingAttachments } from "@/lib/funding-intelligence/store-attachment-text";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  const parsed = Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const count = await extractPendingFundingAttachments(50);
  console.log(`Extracted text from ${count} funding attachment(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
