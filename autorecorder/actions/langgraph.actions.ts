import { type Locator, type Page } from 'playwright';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { getGlobalCursorPos, humanGlide, idleNudge, sleep } from '../core/overlays/cursor';
import { closeNotepad, openNotepad, typeInNotepad } from '../core/overlays/notepad';
import { clickTaskbarApp, ensureOverlays, waitForHydration } from '../core/overlays/taskbar';
import { glideTo } from './glide-click';
import { checkpoint, mark, probeText } from '../core/timeline';

import { humanizeNote } from '../core/overlays/note-style';
/** Notepad typing speed, same as LangGraph-react (fast, like a quick jotted note). */
export const TYPING = { charDelayMs: 34, jitter: 0.65, thinkChance: 0.05 };

/** Plain-words explanation typed into Notepad at the end of each finding clip (REPOS.md Rule 6). */
export const FINDING_NOTES: Record<string, string> = {
  quickstart: [
    'the vue quickstart link lands on the langgraph landing page',
    'it even says running together in the react frontend',
    'only code there is a nextjs route handler, export const POST = handler',
    'no npm create vue, no copilotkit vue install, no server.ts anywhere',
    'and the live demo iframe on it is a 404',
    'so a vue dev has no steps to follow at all',
  ].join('\n'),
  'frontend-tools': [
    'FINDING - Frontend Tools (FINDINGS.md #3, #4)',
    '',
    'App.vue uses runtime-url="/api/copilotkit", but the quickstart runtime',
    'is a separate server. Vite answers 404: "Runtime info request failed".',
    'The chat sends nothing and the filter stays "all".',
    '',
    'With an absolute URL it works on BuiltInAgent, but a LangGraph graph',
    'must bind copilotkit actions - the page shows no agent code at all.',
  ].join('\n'),
  subagents: [
    'subagents page for vue has no vue frontend code at all',
    'the agent file is in the code tab, that part is there',
    'but the code tab frontend is only react, page.tsx and delegation-log.tsx',
    'the delegation log section just says its a reactive render and shows nothing for vue',
    'so u cant build the vue side of this page from the docs',
  ].join('\n'),
  webmcp: [
    'FINDING - WebMCP (FINDINGS.md #6, #13)',
    '',
    'The handler calls searchOrders(status), which is never defined.',
    'The agent calls the tool, the handler throws, and the chat just stops:',
    'no reply, no error, nothing in the console.',
    'the page never says where searchOrders comes from, so you have to invent it.',
    'OrderSearch.vue also has no <template> (Vue warning).',
  ].join('\n'),
};

export interface DocEvidence {
  /** Text inside the element to point at (matched against pre/code/p/li/h2/h3). */
  text: string;
  caption: string;
}

/** Captions are log-only (no on-page overlay). Texts checked against the RENDERED pages (doc-snapshot/rendered/*.txt), not the .md. */
export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  quickstart: [
    { text: 'LangGraph and CopilotKit running together, in the React frontend.', caption: 'The "Vue quickstart" URL shows the LangGraph landing page - React, not Vue' },
    { text: 'export const POST = handler;', caption: 'The only code is a Next.js route; no Vue steps on the rendered page' },
  ],
  'frontend-tools': [
    { text: '<CopilotKitProvider runtime-url="/api/copilotkit">', caption: 'Relative URL: Vite has no /api/copilotkit, the quickstart runtime is a separate server (404)' },
    { text: 'Your agent discovers the name, description, and parameter schema', caption: 'No LangGraph agent code: the quickstart graph never binds frontend tools' },
  ],
  subagents: [
    { text: 'On the frontend, the delegation log is a reactive render of the', caption: 'No Vue frontend code follows; the Code tab frontend is React only' },
  ],
  webmcp: [
    { text: 'useFrontendTool({', caption: 'searchOrders(status) is never defined: the tool call fails silently' },
  ],
};

async function findEvidence(page: Page, text: string) {
  for (const sel of ['pre', 'code', 'p', 'li', 'h2', 'h3']) {
    const loc = page.locator(sel, { hasText: text }).last();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  const any = page.getByText(text, { exact: false }).first();
  if ((await any.count()) > 0 && (await any.isVisible().catch(() => false))) return any;
  return null;
}

/** Go back to the doc page and point at each defect, one by one. */
export async function showDocEvidence(page: Page, config: PageRecordConfig): Promise<void> {
  const items = FINDING_EVIDENCE[config.id];
  if (!items?.length) return;
  console.log(`   🔎 Showing the finding on the doc page (${items.length} spot(s))...`);
  await clickTaskbarApp(page, 'chrome').catch(() => {});
  // The demo's verdict is settled before this point. docs.copilotkit.ai can throw its own React
  // hydration error (#418), and the take's error collectors would blame the app for it, so they
  // are detached before the doc revisit (Antigravity FINDINGS.md #48).
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  await page.goto(config.docUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await ensureOverlays(page, 'chrome');
  await waitForHydration(page, 8000).catch(() => false);
  // tsx keepNames wraps inner functions in __name(); define it so page.evaluate bodies run.
  await page.evaluate('window.__name = window.__name || ((f) => f)');
  await sleep(1500);

  for (const item of items) {
    const target = await findEvidence(page, item.text);
    void checkpoint('evidence', `doc shows "${item.text}"`, () => (target ? probeText(target) : null));
    if (!target) {
      console.warn(`   ⚠️ Evidence not found on the doc page: "${item.text}"`);
      continue;
    }
    mark('evidence', item.text);
    console.log(`   👉 ${item.caption}`);
    await wheelIntoView(page, target, item.text);
    await dragSelect(page, target, item.text);
    // Rest on the highlighted text the way a person pauses while pointing something out.
    for (let i = 0; i < 3; i++) {
      await sleep(900);
      await idleNudge(page);
    }
  }
}

/**
 * Where the wheel scrolls the doc page itself. docs.copilotkit.ai scrolls a full-height <div>, not
 * the window; code boxes (max-h 600px) and the sidebars have their own scrollbars and would eat the
 * wheel, and the sticky header scrolls nothing. Probe a few points over the article and keep the
 * first whose nearest scrolling ancestor is the page scroller (clientHeight >= 70% of the window and
 * containing the article: the sidebar is tall too).
 */
async function pageWheelPoint(page: Page): Promise<{ x: number; y: number } | null> {
  return page
    .evaluate(() => {
      const art = document.querySelector('article') ?? document.querySelector('main');
      const r = art ? art.getBoundingClientRect() : { left: 300, right: window.innerWidth - 300 };
      const xs = [r.left + 6, r.left + 18, r.right - 8, (r.left + r.right) / 2];
      const h = window.innerHeight;
      const ys = [h * 0.5, h * 0.4, h * 0.62, h * 0.3, h * 0.72];
      const pts: { x: number; y: number }[] = [];
      for (const y of ys) for (const x of xs) pts.push({ x, y });
      for (const p of pts) {
        let el = document.elementFromPoint(p.x, p.y) as HTMLElement | null;
        for (; el && el !== document.body; el = el.parentElement) {
          const oy = getComputedStyle(el).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 4) break;
        }
        if (el && el !== document.body && el.clientHeight >= h * 0.7 && (!art || el.contains(art))) return p;
      }
      return null;
    })
    .catch(() => null);
}

/** The text's centre Y, and the rect of its own (non-page) scroll box if it sits in one. */
async function scrollInfo(target: Locator, text?: string): Promise<{ textY: number | null; inner: { top: number; bottom: number; left: number; right: number } | null }> {
  const textY = text ? await textCentreY(target, text) : null;
  const inner = await target
    .evaluate((el) => {
      const h = window.innerHeight;
      for (let e: HTMLElement | null = el as HTMLElement; e && e !== document.body; e = e.parentElement) {
        const oy = getComputedStyle(e).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 4) {
          if (e.clientHeight >= h * 0.7) return null; // the page scroller
          const r = e.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }
      }
      return null;
    })
    .catch(() => null);
  return { textY, inner };
}

async function wheelBurst(page: Page, delta: number): Promise<void> {
  const notches = Math.max(2, Math.round(Math.abs(delta) / 100));
  for (let n = 0; n < notches; n++) {
    await page.mouse.wheel(0, delta / notches);
    await sleep(35 + Math.random() * 45);
  }
  await sleep(250 + Math.random() * 400);
}

/**
 * Scroll the way a person does (mouse-wheel bursts, no programmatic jump): wheel the page from a
 * point that scrolls the page until the text is mid-screen; if the text sits in a code box with its
 * own scrollbar, wheel over that box until the line is inside it. Stops when the page can't move
 * further (target near the top/bottom), instead of looping on the spot.
 */
async function wheelIntoView(page: Page, target: Locator, text?: string): Promise<void> {
  const vh = page.viewportSize()?.height ?? 900;
  const mid = vh * 0.5;
  let lastPageY: number | null = null;
  for (let i = 0; i < 60; i++) {
    const box = await target.boundingBox().catch(() => null);
    if (!box) break;
    const { textY, inner } = await scrollInfo(target, text);
    const ty = textY ?? box.y + Math.min(box.height, 120) / 2;
    // 1. The box is on screen but the line is scrolled away inside it: wheel over the box.
    if (inner && inner.top > 60 && inner.bottom < vh - 30 && (ty < inner.top + 24 || ty > inner.bottom - 24)) {
      const cx = inner.left + Math.min(220, (inner.right - inner.left) / 2);
      const cy = (inner.top + inner.bottom) / 2;
      const { x, y } = getGlobalCursorPos();
      if (Math.abs(x - cx) > 40 || Math.abs(y - cy) > 40) await humanGlide(page, cx, cy);
      const want = ty - cy;
      await wheelBurst(page, Math.sign(want) * Math.min(Math.abs(want), 420));
      continue;
    }
    // 2. Otherwise move the page so the line (or the box) sits mid-screen.
    const anchor = inner && (ty < inner.top || ty > inner.bottom) ? (inner.top + inner.bottom) / 2 : ty;
    const off = anchor - mid;
    if (Math.abs(off) < 140) break;
    // Page already at its top or bottom: the line can't get closer to the middle, stop wheeling.
    if (lastPageY !== null && Math.abs(anchor - lastPageY) < 4 && anchor > 70 && anchor < vh - 30) break;
    lastPageY = anchor;
    const pt = (await pageWheelPoint(page)) ?? { x: 40, y: mid };
    const { x, y } = getGlobalCursorPos();
    if (Math.abs(x - pt.x) > 60 || Math.abs(y - pt.y) > 60) await humanGlide(page, pt.x, pt.y);
    await wheelBurst(page, Math.sign(off) * Math.min(Math.abs(off), 300 + Math.random() * 200));
  }
  await sleep(600);
}

interface TextSpan { sx: number; sy: number; ex: number; ey: number }

/**
 * Viewport position of `text` inside `target`: first and last character. Code blocks can hold
 * more than one copy of the code (one per colour theme, the others hidden), so every match is
 * tried and the first one that is actually rendered wins.
 */
async function locateText(target: Locator, text: string): Promise<TextSpan | null> {
  // Plain loops only: tsx wraps nested named functions in a `__name` helper that does not exist
  // inside the page, which made this evaluate throw and silently fall back.
  return target
    .evaluate((el, needle) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let full = '';
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        nodes.push(n as Text);
        full += (n as Text).data;
      }
      for (let at = full.indexOf(needle); at >= 0; at = full.indexOf(needle, at + 1)) {
        const rects: DOMRect[] = [];
        for (const pos of [at, at + needle.length - 1]) {
          let acc = 0;
          for (const node of nodes) {
            if (pos < acc + node.data.length) {
              const r = document.createRange();
              r.setStart(node, pos - acc);
              r.setEnd(node, Math.min(pos - acc + 1, node.data.length));
              const b = r.getBoundingClientRect();
              if (b.width > 0 && b.height > 0) rects.push(b);
              break;
            }
            acc += node.data.length;
          }
        }
        if (rects.length === 2) {
          const [s, e] = rects;
          return { sx: s.left + 1, sy: s.top + s.height / 2, ex: e.right - 1, ey: e.top + e.height / 2 };
        }
      }
      return null;
    }, text)
    .catch((err) => {
      console.warn(`   ⚠️ locateText failed: ${String(err).slice(0, 160)}`);
      return null;
    });
}

async function textCentreY(target: Locator, text: string): Promise<number | null> {
  return (await locateText(target, text))?.sy ?? null;
}

/**
 * Highlight `text` inside `target` with a real mouse drag (press at its first character,
 * drag to its last, release), so the browser's own text selection marks the faulty snippet.
 * Skipped (with a warning) when the exact text is not on screen.
 */
async function dragSelect(page: Page, target: Locator, text: string): Promise<void> {
  const pts = await locateText(target, text);
  const vh = page.viewportSize()?.height ?? 900;
  // Never drag at a guess: a miss selects whatever is under the cursor (the docs banner, prose).
  if (!pts || pts.sy < 70 || pts.ey > vh - 30) {
    console.warn(`   ⚠️ Text not on screen, not selecting: "${text}"`);
    return;
  }
  await humanGlide(page, pts.sx - 3, pts.sy);
  await sleep(300 + Math.random() * 300);
  await page.mouse.down();
  await humanGlide(page, pts.ex + 2, pts.ey, 34);
  await sleep(120);
  await page.mouse.up();
}

export async function writeFinding(page: Page, config: PageRecordConfig): Promise<void> {
  await showDocEvidence(page, config).catch((e) => console.warn(`   ⚠️ Doc evidence step failed: ${String(e).slice(0, 120)}`));
  const body = FINDING_NOTES[config.id];
  if (!body) return;
  mark('notepad');
  await openNotepad(page, `finding-${config.id}.txt`);
  await typeInNotepad(page, humanizeNote(body), TYPING);
  await closeNotepad(page, 4000);
  mark('notepad-closed');
}

async function settle(
  page: Page,
  msgCount: number,
  ctx: ActionContext,
  opts?: { startTimeoutMs?: number; streamTimeoutMs?: number },
): Promise<void> {
  try {
    await waitForAgentResponseCompletion(page, 2500, msgCount, undefined, opts);
  } catch (e) {
    ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`);
  }
}

/** Quickstart works as published (BuiltInAgent); the finding is that it is not LangGraph. */
export const runQuickstartAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    await writeFinding(page, config);
  }
};

/** Frontend Tools (level 3, working clip): the filter changes once runtime-url is absolute (HARNESS route). */
export const runFrontendToolsAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const changed = await page
    .waitForFunction(() => !/Current filter: all/.test(document.body.innerText), null, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  await glideTo(page, page.getByText(/Current filter:/).first(), 2500);
  if (!changed) ctx.fail('filter_incidents never ran (expected to work on the HARNESS route).');
};

/** Sub-Agents: nothing to run; show the placeholder, then the doc. */
export const runSubagentsAction: PageActionHandler = async (page, config, _root, ctx) => {
  try {
    // The placeholder route is empty on purpose (no <p> to wait for): rest the cursor over the
    // blank page for a few seconds and move on, so the demo segment is short.
    const vp = page.viewportSize() ?? { width: 1280, height: 720 };
    await humanGlide(page, vp.width * 0.5, vp.height * 0.45, 25);
    await sleep(3500);
    ctx.fail('No Vue frontend code published (Code tab is React only): page cannot be implemented in Vue (FINDINGS.md #7).');
  } finally {
    await writeFinding(page, config);
  }
};

/** WebMCP (level 1): verbatim OrderSearch.vue. searchOrders is never defined, the handler throws and the chat never replies (FINDINGS.md #6). */
export const runWebMcpAction: PageActionHandler = async (page, config, _root, ctx) => {
  try {
    const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
    await settle(page, msgCount, ctx, { startTimeoutMs: 30000, streamTimeoutMs: 45000 });
    await sleep(2500);
    const after = await page.evaluate(() => document.body.innerText.split('find my open orders.')[1] ?? '');
    if (/A-100\d|order/i.test(after)) ctx.warn('A reply mentioning orders appeared on the verbatim route: check FINDINGS.md #6.');
    else ctx.fail('No reply: the handler calls searchOrders(status), which the page never defines (FINDINGS.md #6).');
  } finally {
    await writeFinding(page, config);
  }
};

// humanizeNote: the shared hurried Notepad style lives in core/overlays/note-style.ts (AUTORECORDER.md section 2).
export { humanizeNote };
