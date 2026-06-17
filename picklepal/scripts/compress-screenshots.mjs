/**
 * One-off script: convert public/screenshots/*.png → .webp
 * Run from the picklepal/ directory: node scripts/compress-screenshots.mjs
 *
 * Display dimensions at runtime (max rendered width):
 *   group-home-phone.png    → rendered inside 268px phone frame → use width 390 (natural size is fine, <600px)
 *   leaderboard-phone.png   → rendered inside 220px phone frame → use width 390
 *   history-phone.png       → not currently used in landing (skip downscale)
 *   group-home-desktop.png  → full-width image, max 1440px → keep 1440
 *   features-desktop.png    → full-width image, max 1440px → keep 1440
 *   workflow-*.png          → rendered ~200px tall cards → max 800px wide is fine
 *
 * Quality 80 for all; downscale phone shots to 600px wide (retina-safe for their actual render size).
 */

import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, "..", "public", "screenshots");

const configs = {
  "group-home-phone.png":    { width: 600,  quality: 80 },
  "leaderboard-phone.png":   { width: 600,  quality: 80 },
  "history-phone.png":       { width: 600,  quality: 80 },
  "group-home-desktop.png":  { width: 1440, quality: 80 },
  "features-desktop.png":    { width: 1440, quality: 80 },
  "workflow-pick.png":       { width: 800,  quality: 80 },
  "workflow-rotate.png":     { width: 800,  quality: 80 },
  "workflow-score.png":      { width: 800,  quality: 80 },
  "workflow-recap.png":      { width: 800,  quality: 80 },
};

const files = await readdir(screenshotsDir);
const pngs = files.filter((f) => extname(f) === ".png");

console.log(`Found ${pngs.length} PNG files in ${screenshotsDir}\n`);

for (const file of pngs) {
  const cfg = configs[file];
  if (!cfg) {
    console.log(`  [SKIP] ${file} — no config defined`);
    continue;
  }

  const inputPath = join(screenshotsDir, file);
  const outputName = basename(file, ".png") + ".webp";
  const outputPath = join(screenshotsDir, outputName);

  const beforeStat = await stat(inputPath);
  const beforeKB = (beforeStat.size / 1024).toFixed(1);

  const meta = await sharp(inputPath).metadata();
  const naturalWidth = meta.width ?? 9999;

  // Only resize if the natural width exceeds the config cap
  let pipeline = sharp(inputPath);
  if (naturalWidth > cfg.width) {
    pipeline = pipeline.resize({ width: cfg.width, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: cfg.quality }).toFile(outputPath);

  const afterStat = await stat(outputPath);
  const afterKB = (afterStat.size / 1024).toFixed(1);
  const savings = (((beforeStat.size - afterStat.size) / beforeStat.size) * 100).toFixed(1);

  console.log(`  ${file}`);
  console.log(`    ${beforeKB} KB → ${afterKB} KB  (${savings}% smaller)`);
  console.log(`    → ${outputName}`);
}

console.log("\nDone. Update <Image src=...> references to .webp in landing components.");
