/**
 * Pages of https://docs.copilotkit.ai/vue/langgraph-typescript under test. One Vite app (5150);
 * App.vue picks the doc page's root by path (HARNESS). The quickstart clip uses the doc's own
 * server.ts (BuiltInAgent, 8150). See FINDINGS.md for what each clip proves.
 */
import { definePages } from '../core/types';

export const SKIP_RECORDING: Record<string, string> = {
  'agentic-chat-ui': 'Unreachable: not in the Vue sidebar, not linked from a reachable page (out of scope, 2026-11-11).',
};

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart (Vue)',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: '',
    ideFile: 'my-copilot-app/VERSIONS.md',
    startLine: 1,
    endLine: 20,
    extraTabs: [
      { filePath: 'my-copilot-app/server.ts', startLine: 1, endLine: 26 },
      { filePath: 'my-copilot-app/src/main.ts', startLine: 1, endLine: 5 },
      { filePath: 'my-copilot-app/src/pages/QuickstartApp.vue', startLine: 1, endLine: 15 },
      { filePath: 'my-copilot-app/server.langgraph.ts', startLine: 1, endLine: 22 },
    ],
    prompt: 'Which model and agent framework are you running on? One sentence.',
    waitAfterPromptMs: 3000,
  },
  {
    id: 'frontend-tools',
    name: 'Frontend Tools (Vue)',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    // Level 3 (QA-RULES §8a): works once runtime-url is the quickstart's absolute URL (HARNESS route, FINDINGS #3 minor).
    route: 'frontend-tools-builtin',
    ideFile: 'my-copilot-app/src/components/DashboardAgent.vue',
    startLine: 1,
    endLine: 27,
    extraTabs: [{ filePath: 'my-copilot-app/src/pages/FrontendToolsBuiltinApp.vue', startLine: 1, endLine: 11 }],
    prompt: 'Show only sev1 incidents.',
  },
  {
    id: 'agentic-chat-ui',
    name: 'Chat Components (Vue)',
    videoName: 'ChatComponents',
    docPath: 'agentic-chat-ui',
    route: 'agentic-chat-ui',
    ideFile: 'my-copilot-app/src/pages/ChatComponentsApp.vue',
    startLine: 1,
    endLine: 12,
    extraTabs: [{ filePath: 'my-copilot-app/src/app/demos/agentic-chat/suggestions.ts', startLine: 1, endLine: 18 }],
    prompt: 'Write a sonnet',
  },
  {
    id: 'subagents',
    name: 'Sub-Agents (Vue)',
    videoName: 'SubAgents',
    docPath: 'multi-agent/subagents',
    route: 'subagents',
    // Code tab agent, verbatim (FINDINGS.md #7: only the Vue frontend is missing).
    ideFile: 'agent/src/subagents.codetab.ts',
    startLine: 340,
    endLine: 360,
    extraTabs: [{ filePath: 'my-copilot-app/src/pages/SubagentsApp.vue', startLine: 1, endLine: 4 }],
    prompt: '-',
  },
  {
    id: 'webmcp',
    name: 'WebMCP (Vue)',
    videoName: 'WebMCP',
    docPath: 'webmcp',
    // Level 1 (QA-RULES §8a): verbatim OrderSearch.vue; searchOrders is never defined, so the tool call
    // dies silently and the chat never replies (FINDINGS.md #6). The HARNESS helper route
    // (/webmcp-harness) is kept as evidence only, not filmed.
    route: 'webmcp',
    ideFile: 'my-copilot-app/src/components/OrderSearch.vue',
    startLine: 1,
    endLine: 21,
    extraTabs: [{ filePath: 'my-copilot-app/src/pages/WebMcpApp.vue', startLine: 1, endLine: 18 }],
    prompt: 'Use the searchOrders tool to find my open orders.',
  },
]);
