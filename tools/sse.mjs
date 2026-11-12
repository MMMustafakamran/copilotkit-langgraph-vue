// HARNESS: dump AG-UI event types of each run on a route. node tools/sse.mjs <route> "<prompt>" [waitMs]
import { createRequire } from 'node:module';
const require = createRequire(new URL('../autorecorder/package.json', import.meta.url));
const { chromium } = require('playwright');
const [route, prompt, waitMs = '90000'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
p.on('response', async r => { if (r.url().includes('/run')) { const t = await r.text().catch(e => 'ERR ' + e.message);
  const evs = [...t.matchAll(/"type":"([A-Z_]+)"/g)].map(m => m[1]); console.log('RUN', r.status(), evs.join(','));
  for (const m of t.matchAll(/"(?:content|delta|message)":"([^"]{0,200})/g)) if (/defined|rror/i.test(m[1])) console.log('  ', m[1]); } });
await p.goto('http://localhost:5150' + route, { waitUntil: 'networkidle' });
const i = p.locator('textarea').first(); await i.fill(prompt); await i.press('Enter');
await p.waitForTimeout(Number(waitMs)); await b.close();
