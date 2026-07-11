import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'https://www.dinkday.site';
const OUT  = './public/screenshots';
mkdirSync(OUT, { recursive: true });

const PHONE   = { width: 390, height: 844, deviceScaleFactor: 3 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

const shots = [
  { path: '/g/picklepal',         file: 'group-home-desktop',    viewport: DESKTOP },
  { path: '/g/picklepal',         file: 'features-desktop',      viewport: DESKTOP },
  { path: '/g/picklepal',         file: 'group-home-phone',      viewport: PHONE   },
  { path: '/g/picklepal/board',   file: 'leaderboard-phone',     viewport: PHONE   },
  { path: '/g/picklepal/history', file: 'history-phone',         viewport: PHONE   },
];

const browser = await chromium.launch();

for (const shot of shots) {
  const ctx  = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: shot.viewport.deviceScaleFactor });
  const page = await ctx.newPage();
  console.log(`Capturing ${shot.file}...`);
  try {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${shot.file}.png`, fullPage: false });
    console.log(`  -> saved ${shot.file}.png`);
  } catch (e) {
    console.error(`  -> failed: ${e.message}`);
  }
  await ctx.close();
}

await browser.close();
console.log('Done.');
