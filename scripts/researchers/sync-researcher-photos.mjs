import fs from "fs";
import path from "path";

const SOURCE_DIR =
  process.env.RESEARCHER_PHOTO_SOURCE ??
  "D:\\02_Toon Titi\\99_SOC_CMU\\06_โครงการงานบริหารงานวิจัยฯ\\99_Thiti_project\\ResearcherPhoto";

const DEST_DIR = path.join(
  path.resolve(import.meta.dirname, "../.."),
  "public",
  "images",
  "researchers",
);

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source folder not found: ${SOURCE_DIR}`);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((name) => fs.statSync(path.join(SOURCE_DIR, name)).isFile());

  let copied = 0;
  for (const fileName of files) {
    fs.copyFileSync(path.join(SOURCE_DIR, fileName), path.join(DEST_DIR, fileName));
    copied += 1;
  }

  console.log(`Synced ${copied} researcher photos`);
  console.log(`From: ${SOURCE_DIR}`);
  console.log(`To:   ${DEST_DIR}`);
}

main();
