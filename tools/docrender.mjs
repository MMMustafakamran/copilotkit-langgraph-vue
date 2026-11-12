// HARNESS: dump rendered doc page text + links + iframes. node tools/docrender.mjs <slug> <outdir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(new URL('../autorecorder/package.json', import.meta.url));
const { chromium } = require('playwright');
const [slug, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const url = 'https://docs.copilotkit.ai/vue/langgraph-typescript' + (slug ? '/' + slug : '');
const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 }).catch(e => { console.log('GOTO ERR', e.message.slice(0,300)); return null; });
await page.waitForTimeout(4000);
const data = await page.evaluate(() => ({
  final: location.href, title: document.title,
  text: (document.querySelector('main') || document.body).innerText,
  links: [...document.querySelectorAll('main a[href]')].map(a => a.href),
  iframes: [...document.querySelectorAll('iframe')].map(f => f.src),
}));
const name = (slug || 'root').replace(/\//g, '_');
fs.writeFileSync(`${out}/${name}.txt`, `URL ${url}\nFINAL ${data.final}\nSTATUS ${resp?.status()}\nTITLE ${data.title}\nIFRAMES ${data.iframes.join(' ')}\nLINKS\n${[...new Set(data.links)].join('\n')}\n---\n${data.text}`);
await page.screenshot({ path: `${out}/${name}.png` });
console.log(name, resp?.status(), data.final, data.iframes);
await browser.close();
