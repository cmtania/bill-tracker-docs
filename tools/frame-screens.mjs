// The site's screens: real simulator captures from the app repo (../bill-tracker/docs/raw),
// put in an iPhone or iPad frame on a transparent background with headless Chrome, written to
// public/assets/screens. The page adds the drop shadow.
//
//   node tools/frame-screens.mjs [path/to/raw]

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const rawDir = resolve(process.argv[2] ?? join(site, '../bill-tracker/docs/raw'));
const outDir = join(site, 'public/assets/screens');
const buildDir = join(here, '.build');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const phoneShot = (time) => `Simulator Screenshot - iPhone 17 Pro - 2026-10-03 at ${time}.png`;
const padShot = (time) => `Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-10-03 at ${time}.png`;

// File on the site ← capture.
const PHONES = {
  kitchen: '21.46.54',
  'up-close': '21.47.01',
  calendar: '21.47.10',
  receipts: '21.47.16',
  print: '21.48.29',
  'lights-off': '21.48.41',
  'mark-paid': '21.48.57',
  themes: '21.49.52',
  widgets: '21.51.56',
  pick: '21.44.03',
};
const PADS = {
  'ipad-kitchen': '21.34.21',
  // The Pro fridge up close, not the Pro screen: that capture still had the free week,
  // which the app dropped (App Review 3.1.2(c), 2026-10-15).
  'pro-fridge': '21.33.34',
};

const PHONE = { w: 1206, h: 2622 };
const PAD = { w: 2752, h: 2064 };

/** The device's outer size and the screen inside it, for an outer width `w`. */
function frame(kind, w) {
  const img = kind === 'phone' ? PHONE : PAD;
  const ring = w * (kind === 'phone' ? 0.011 : 0.0045);
  const bezel = w * (kind === 'phone' ? 0.026 : 0.019);
  const sw = w - 2 * (ring + bezel);
  const sh = (sw * img.h) / img.w;
  const r = sw * (kind === 'phone' ? 0.135 : 0.026);
  return { w, h: Math.round(sh + 2 * (ring + bezel)), ring, bezel, sw, sh, r };
}

function page(src, f) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${f.w}px;height:${f.h}px;background:transparent;overflow:hidden}
.dev{width:${f.w}px;height:${f.h}px;padding:${f.ring}px;border-radius:${f.r + f.ring + f.bezel}px;
  background:linear-gradient(135deg,#B9BBC1 0%,#45474C 16%,#1C1D20 50%,#45474C 84%,#C9CBD1 100%)}
.bezel{position:relative;height:100%;padding:${f.bezel}px;border-radius:${f.r + f.bezel}px;background:#050506}
img{display:block;width:${f.sw}px;height:${f.sh}px;border-radius:${f.r}px}
.glare{position:absolute;inset:${f.bezel}px;border-radius:${f.r}px;background:linear-gradient(125deg,rgba(255,255,255,.12),rgba(255,255,255,0) 28%)}
</style></head><body><div class="dev"><div class="bezel"><img src="${pathToFileURL(src)}"><div class="glare"></div></div></div></body></html>`;
}

mkdirSync(outDir, { recursive: true });
mkdirSync(buildDir, { recursive: true });
const jobs = [
  ...Object.entries(PHONES).map(([name, time]) => [name, phoneShot(time), 'phone', 900]),
  ...Object.entries(PADS).map(([name, time]) => [name, padShot(time), 'pad', 1800]),
];
for (const [name, file, kind, width] of jobs) {
  const f = frame(kind, width);
  const htmlPath = join(buildDir, `${name}.html`);
  writeFileSync(htmlPath, page(join(rawDir, file), f));
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--default-background-color=00000000', '--allow-file-access-from-files', '--virtual-time-budget=3000',
    `--window-size=${f.w},${f.h}`, `--screenshot=${join(outDir, name + '.png')}`, pathToFileURL(htmlPath).href,
  ], { stdio: 'ignore' });
  console.log('✓', name, `${f.w}×${f.h}`);
}
