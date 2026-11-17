import fs from "node:fs";
import path from "node:path";

export const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
export const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

export function loadEnv(filePath = ENV_PATH) {
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

function extractProjectRef(env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const match = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function extractPasswordFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null;

  try {
    const parsed = new URL(databaseUrl);
    return parsed.password ? decodeURIComponent(parsed.password) : null;
  } catch {
    return null;
  }
}

function buildDirectDatabaseUrl(env, password) {
  const projectRef = extractProjectRef(env);
  if (!projectRef || !password) return null;

  const host = env.SUPABASE_DB_HOST ?? `db.${projectRef}.supabase.co`;
  const port = env.SUPABASE_DB_PORT ?? "5432";
  const user = env.SUPABASE_DB_USER ?? "postgres";
  const database = env.SUPABASE_DB_NAME ?? "postgres";
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}?sslmode=require`;
}

function buildPoolerDatabaseUrl(env, password, port = "5432") {
  const projectRef = extractProjectRef(env);
  if (!projectRef || !password) return null;

  const region = env.SUPABASE_DB_REGION ?? "ap-southeast-1";
  const database = env.SUPABASE_DB_NAME ?? "postgres";
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/${database}?sslmode=require`;
}

export function resolveDatabaseUrl(env = loadEnv()) {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL.includes("sslmode=")
      ? env.DATABASE_URL
      : `${env.DATABASE_URL}${env.DATABASE_URL.includes("?") ? "&" : "?"}sslmode=require`;
  }

  const password = env.SUPABASE_DB_PASSWORD;
  if (!password) return null;

  if (env.SUPABASE_USE_POOLER === "true") {
    return buildPoolerDatabaseUrl(env, password);
  }

  return buildDirectDatabaseUrl(env, password);
}

export function resolveDatabaseCandidates(env = loadEnv()) {
  const candidates = [];
  const seen = new Set();
  const add = (url, label) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push({ url, label });
  };

  const password =
    env.SUPABASE_DB_PASSWORD ?? extractPasswordFromDatabaseUrl(env.DATABASE_URL) ?? null;

  if (env.DATABASE_URL) {
    add(resolveDatabaseUrl(env), "database-url");
  }

  if (password) {
    add(buildPoolerDatabaseUrl(env, password, "5432"), "session-pooler");
    add(buildPoolerDatabaseUrl(env, password, "6543"), "transaction-pooler");
    add(buildDirectDatabaseUrl(env, password), "direct-db-host");
  }

  return candidates;
}
