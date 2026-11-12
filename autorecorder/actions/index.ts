/**
 * Which handler serves which page id. Pages not listed here use runStandardAction
 * (send the page's prompt, wait for the reply).
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import {
  runFrontendToolsAction,
  runQuickstartAction,
  runSubagentsAction,
  runWebMcpAction,
} from './langgraph.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  quickstart: runQuickstartAction,
  'frontend-tools': runFrontendToolsAction,
  subagents: runSubagentsAction,
  webmcp: runWebMcpAction,
};

/**
 * Pages that never get a usable chat input (blank by defect, or a placeholder) would otherwise
 * burn the full 30 s readiness wait on camera. Routes are pre-warmed, so a few seconds is enough.
 */
const READY_TIMEOUT_MS: Record<string, number> = {
  subagents: 6000,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  // Vite serves modules lazily, so markup can be on screen before anything is wired to it.
  await waitForPageReady(page, { label: config.id, timeoutMs: READY_TIMEOUT_MS[config.id] });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
