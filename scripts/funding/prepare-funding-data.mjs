import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const SOURCE_DIR =
  process.env.FUNDING_SOURCE ??
  "D:\\02_Toon Titi\\99_SOC_CMU\\06_โครงการงานบริหารงานวิจัยฯ\\99_Thiti_project\\Funding";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const PUBLIC_IMAGES = path.join(PROJECT_ROOT, "public", "images", "funding");
const PUBLIC_DOCS = path.join(PROJECT_ROOT, "public", "documents", "funding");
const SEED_DIR = path.join(PROJECT_ROOT, "supabase", "seed");
const CACHE_FILE = path.join(PROJECT_ROOT, "src", "data", "funding-import.json");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function detectFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".doc" || ext === ".docx") return "doc";
  return "pdf";
}

function resolveImageSource(photoDir, fundingId) {
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = path.join(photoDir, `${fundingId}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  }
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\n")}`, "utf8");
}

function formatOpenCloseDate(label, value) {
  if (!value) return "";
  return `${label} ${value}`;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Funding source folder not found: ${SOURCE_DIR}`);
  }

  const excelPath = path.join(SOURCE_DIR, "Funding_Database_Formatted.xlsx");
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  ensureDir(PUBLIC_IMAGES);
  ensureDir(PUBLIC_DOCS);
  ensureDir(SEED_DIR);

  const fundings = [];
  const attachments = [];
  const cacheItems = [];

  rows.forEach((row, index) => {
    const fundingId = String(row.ID).trim();
    const fundingCode = String(row.Funding_ID).trim();
    const folderPath = path.join(SOURCE_DIR, fundingId);
    const imageSource = resolveImageSource(path.join(SOURCE_DIR, "FundingPhoto"), fundingId);

    let imagePath = "";
    if (imageSource) {
      const imageExt = path.extname(imageSource).toLowerCase();
      imagePath = `${fundingId}${imageExt}`;
      copyFile(imageSource, path.join(PUBLIC_IMAGES, imagePath));
    }

    const fundingAttachments = [];
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter((name) => fs.statSync(path.join(folderPath, name)).isFile());
      files.sort((a, b) => a.localeCompare(b, "en"));

      files.forEach((fileName, fileIndex) => {
        const src = path.join(folderPath, fileName);
        const destRelative = `${fundingId}/${fileName}`;
        copyFile(src, path.join(PUBLIC_DOCS, destRelative));

        const attachment = {
          funding_id: fundingId,
          file_name: fileName,
          file_type: detectFileType(fileName),
          storage_path: destRelative,
          file_order: fileIndex + 1,
        };

        attachments.push(attachment);
        fundingAttachments.push({
          id: `${fundingId}-${fileIndex + 1}`,
          fileName,
          type: attachment.file_type,
          downloadUrl: `/documents/funding/${destRelative}`,
        });
      });
    }

    const fundingRow = {
      funding_id: fundingId,
      funding_code: fundingCode,
      title: String(row.Fund_N).trim(),
      full_title: String(row.Fund_N).trim(),
      organization: String(row.Organize_N).trim(),
      status_label: "ทุนวิจัยที่เปิดรับ",
      published_date: String(row["วันที่ประกาศทุน"]).trim(),
      open_date: String(row["วันที่เปิดรับ"]).trim(),
      close_date: String(row["วันที่ปิดรับ"]).trim(),
      source_url: String(row.link).trim(),
      details: String(row.Details).trim(),
      image_path: imagePath,
      display_order: index + 1,
    };

    fundings.push(fundingRow);
    cacheItems.push({
      id: fundingId,
      fundingCode,
      title: fundingRow.title,
      organization: fundingRow.organization,
      openDate: formatOpenCloseDate("เปิดรับวันที่", fundingRow.open_date),
      closeDate: formatOpenCloseDate("ปิดรับวันที่", fundingRow.close_date),
      publishedDate: fundingRow.published_date,
      statusLabel: fundingRow.status_label,
      imageSrc: imagePath ? `/images/funding/${imagePath}` : undefined,
      imageVariant: ((index % 3) + 1),
      sourceUrl: fundingRow.source_url,
      details: fundingRow.details,
      attachments: fundingAttachments,
    });
  });

  writeCsv(
    path.join(SEED_DIR, "fundings.csv"),
    [
      "funding_id",
      "funding_code",
      "title",
      "full_title",
      "organization",
      "status_label",
      "published_date",
      "open_date",
      "close_date",
      "source_url",
      "details",
      "image_path",
      "display_order",
    ],
    fundings,
  );

  writeCsv(
    path.join(SEED_DIR, "funding_attachments.csv"),
    ["funding_id", "file_name", "file_type", "storage_path", "file_order"],
    attachments,
  );

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheItems, null, 2), "utf8");

  console.log(`Prepared ${fundings.length} fundings`);
  console.log(`Prepared ${attachments.length} attachments`);
  console.log(`Images -> ${PUBLIC_IMAGES}`);
  console.log(`Documents -> ${PUBLIC_DOCS}`);
  console.log(`Seed CSV -> ${SEED_DIR}`);
  console.log(`Cache -> ${CACHE_FILE}`);
}

main();
