import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadEnv, PROJECT_ROOT, resolveDatabaseCandidates } from "./lib/env.mjs";

const BACKUP_ROOT = path.join(PROJECT_ROOT, "backups", "supabase");
const SCHEMA_DIR = path.join(PROJECT_ROOT, "supabase");
const KEEP_COUNT = Number.parseInt(process.env.BACKUP_KEEP_COUNT ?? "14", 10);

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "_",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRepoSchemaFiles(targetDir) {
  ensureDir(targetDir);
  const files = fs
    .readdirSync(SCHEMA_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    fs.copyFileSync(path.join(SCHEMA_DIR, file), path.join(targetDir, file));
  }

  return files;
}

function findPgDump() {
  const candidates = ["pg_dump", "pg_dump.exe"];

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  try {
    const versions = fs
      .readdirSync(path.join(programFiles, "PostgreSQL"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(programFiles, "PostgreSQL", entry.name, "bin", "pg_dump.exe"));
    candidates.push(...versions.reverse());
  } catch {
    // PostgreSQL not installed in Program Files.
  }

  for (const command of candidates) {
    const result = spawnSync(command, ["--version"], { encoding: "utf8" });
    if (result.status === 0) return command;
  }
  return null;
}

function runPgDump(databaseUrl, outputFile, extraArgs = []) {
  const pgDump = findPgDump();
  if (!pgDump) return { ok: false, reason: "pg_dump not found" };

  const args = [
    "--no-owner",
    "--no-acl",
    "--clean",
    "--if-exists",
    "--quote-all-identifiers",
    ...extraArgs,
    `--file=${outputFile}`,
    databaseUrl,
  ];

  const result = spawnSync(pgDump, args, {
    encoding: "utf8",
    env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE ?? "require" },
  });

  if (result.status !== 0) {
    return {
      ok: false,
      reason: result.stderr?.trim() || result.stdout?.trim() || "pg_dump failed",
    };
  }

  return { ok: true };
}

async function connectPgClient(databaseUrl) {
  const pg = await import("pg");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

async function exportWithPg(client, backupDir) {

  const tablesResult = await client.query(`
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
    order by c.relname
  `);

  const tables = tablesResult.rows.map((row) => row.table_name);
  const dataDir = path.join(backupDir, "data");
  ensureDir(dataDir);

  const manifest = {
    method: "node-pg",
    exportedAt: new Date().toISOString(),
    tables: {},
  };

  for (const tableName of tables) {
    const columnsResult = await client.query(
      `
      select column_name, udt_name, data_type
      from information_schema.columns
      where table_schema = 'public' and table_name = $1
      order by ordinal_position
      `,
      [tableName],
    );

    const columns = columnsResult.rows;
    const columnNames = columns.map((column) => column.column_name);
    const rows = [];
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      const page = await client.query(
        `select * from public.${quoteIdent(tableName)} order by 1 limit $1 offset $2`,
        [pageSize, offset],
      );
      rows.push(...page.rows);
      if (page.rows.length < pageSize) break;
      offset += pageSize;
    }

    const lines = [
      `-- table: ${tableName}`,
      `-- rows: ${rows.length}`,
      `-- exported: ${new Date().toISOString()}`,
      "",
    ];

    for (const row of rows) {
      const values = columnNames.map((columnName, index) =>
        formatSqlValue(row[columnName], columns[index]),
      );
      lines.push(
        `insert into public.${quoteIdent(tableName)} (${columnNames.map(quoteIdent).join(", ")}) values (${values.join(", ")});`,
      );
    }

    const filePath = path.join(dataDir, `${tableName}.sql`);
    fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
    manifest.tables[tableName] = { rows: rows.length, file: path.relative(backupDir, filePath) };
    console.log(`  data  ${tableName}: ${rows.length} rows`);
  }

  const schemaFile = path.join(backupDir, "schema-from-db.sql");
  const schemaParts = ["-- public schema objects exported from live database", ""];

  const extensions = await client.query(`
    select extname
    from pg_extension
    where extname in ('vector', 'pgcrypto', 'uuid-ossp')
    order by extname
  `);
  for (const row of extensions.rows) {
    schemaParts.push(`create extension if not exists "${row.extname}";`);
  }
  schemaParts.push("");

  const functions = await client.query(`
    select p.proname as name, pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by p.proname
  `);
  for (const row of functions.rows) {
    schemaParts.push(`${row.definition};`, "");
  }

  fs.writeFileSync(schemaFile, `${schemaParts.join("\n")}\n`, "utf8");
  manifest.schemaFromDb = path.relative(backupDir, schemaFile);

  await client.end();
  return manifest;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function escapeLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function formatSqlValue(value, columnMeta) {
  if (value === null || value === undefined) return "null";

  if (columnMeta?.udt_name === "vector") {
    const vectorText = Array.isArray(value) ? `[${value.join(",")}]` : String(value);
    return `'${vectorText.replace(/'/g, "''")}'::vector`;
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return escapeLiteral(value.toISOString());
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;
  if (typeof value === "object") return `${escapeLiteral(JSON.stringify(value))}::jsonb`;

  return escapeLiteral(value);
}

function writeManifest(backupDir, manifest) {
  fs.writeFileSync(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function buildFullRestoreFile(backupDir, manifest) {
  const chunks = [
    "-- RNM-Proj Supabase backup bundle",
    `-- created: ${manifest.createdAt}`,
    "",
  ];

  const schemaFiles = [
    path.join(backupDir, "schema", "full-schema.sql"),
    path.join(backupDir, "schema-from-db.sql"),
    path.join(backupDir, "full-schema.sql"),
    path.join(backupDir, "full-data.sql"),
  ].filter((filePath) => fs.existsSync(filePath));

  for (const filePath of schemaFiles) {
    chunks.push(`-- >>> ${path.basename(filePath)}`, fs.readFileSync(filePath, "utf8"), "");
  }

  if (manifest.tables) {
    for (const tableName of Object.keys(manifest.tables).sort()) {
      const tableFile = path.join(backupDir, manifest.tables[tableName].file);
      if (fs.existsSync(tableFile)) {
        chunks.push(`-- >>> ${tableName}`, fs.readFileSync(tableFile, "utf8"), "");
      }
    }
  }

  fs.writeFileSync(path.join(backupDir, "full-restore.sql"), chunks.join("\n"), "utf8");
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) return;

  const entries = fs
    .readdirSync(BACKUP_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const dirName of entries.slice(Math.max(KEEP_COUNT, 1))) {
    fs.rmSync(path.join(BACKUP_ROOT, dirName), { recursive: true, force: true });
    console.log(`Removed old backup: ${dirName}`);
  }
}

async function exportDatabase(candidates, backupDir) {
  const schemaDump = path.join(backupDir, "full-schema.sql");
  const dataDump = path.join(backupDir, "full-data.sql");
  const pgDump = findPgDump();
  const errors = [];

  if (pgDump) {
    console.log(`Using ${pgDump} for full SQL dump`);
    for (const candidate of candidates) {
      console.log(`Trying ${candidate.label}...`);
      const schemaResult = runPgDump(candidate.url, schemaDump, ["--schema-only"]);
      if (!schemaResult.ok) {
        errors.push(`${candidate.label} schema: ${schemaResult.reason}`);
        continue;
      }

      const dataResult = runPgDump(candidate.url, dataDump, [
        "--data-only",
        "--inserts",
        "--column-inserts",
        "--exclude-schema=auth",
        "--exclude-schema=storage",
      ]);
      if (!dataResult.ok) {
        errors.push(`${candidate.label} data: ${dataResult.reason}`);
        continue;
      }

      return {
        method: "pg_dump",
        connection: candidate.label,
        files: {
          schema: "full-schema.sql",
          data: "full-data.sql",
        },
      };
    }
  } else {
    console.log("pg_dump not found — using Node/pg table export");
  }

  for (const candidate of candidates) {
    console.log(`Trying ${candidate.label}...`);
    try {
      const client = await connectPgClient(candidate.url);
      try {
        const tableManifest = await exportWithPg(client, backupDir);
        return {
          method: "node-pg",
          connection: candidate.label,
          tables: tableManifest.tables,
          schemaFromDb: tableManifest.schemaFromDb,
        };
      } finally {
        await client.end();
      }
    } catch (error) {
      errors.push(`${candidate.label}: ${error.message}`);
    }
  }

  throw new Error(
    errors.length
      ? `All database connection attempts failed:\n- ${errors.join("\n- ")}`
      : "No database connection candidates available.",
  );
}

async function main() {
  const env = loadEnv();
  const candidates = resolveDatabaseCandidates(env);
  const backupDir = path.join(BACKUP_ROOT, timestamp());
  ensureDir(backupDir);

  const repoSchemaDir = path.join(backupDir, "repo-schema");
  const repoSchemaFiles = copyRepoSchemaFiles(repoSchemaDir);
  console.log(`Backup folder: ${backupDir}`);
  console.log(`Copied ${repoSchemaFiles.length} repo schema files`);

  const manifest = {
    createdAt: new Date().toISOString(),
    projectUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    repoSchemaFiles,
    method: null,
  };

  if (!candidates.length) {
    manifest.method = "repo-schema-only";
    manifest.warning =
      "No DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local — only repo SQL files were copied.";
    writeManifest(backupDir, manifest);
    buildFullRestoreFile(backupDir, manifest);
    console.log("\nPartial backup only.");
    console.log("Add DATABASE_URL or SUPABASE_DB_PASSWORD to .env.local for full database export.");
    console.log("Supabase Dashboard → Project Settings → Database → Connection string / password");
    process.exitCode = 1;
    return;
  }

  const exportResult = await exportDatabase(candidates, backupDir);
  manifest.method = exportResult.method;
  manifest.connection = exportResult.connection;
  if (exportResult.files) manifest.files = exportResult.files;
  if (exportResult.tables) manifest.tables = exportResult.tables;
  if (exportResult.schemaFromDb) manifest.schemaFromDb = exportResult.schemaFromDb;

  writeManifest(backupDir, manifest);
  buildFullRestoreFile(backupDir, manifest);
  pruneOldBackups();

  console.log("\nBackup completed.");
  console.log(`Connection: ${exportResult.connection}`);
  console.log(`Restore bundle: ${path.join(backupDir, "full-restore.sql")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
