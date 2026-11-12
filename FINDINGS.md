# Findings — LangGraph-vue (LangGraph JS / TypeScript + Vue)
Open doc defects only. Written from probe evidence (`.qa/instructions/QA-RULES.md` section 6). Numbers are stable IDs (code cites `FINDINGS.md #N`), so gaps are removed findings. React-side findings are in `LangGraph-react/FINDINGS.md` (cited as React #N).
Stack: `@copilotkit/vue`/`runtime` 1.85.0 (declared ^1.85.0), `@copilotkit/core` 1.85.0 (transitive), `zod` 3.25.76 (transitive), `vue` 3.5.44 (declared ^3.5.42), `vite` 8.3.5 (declared ^8.2.2), `tsx` 4.23.15, agent: LangGraph JS server from `LangGraph-react/agent` (`@langchain/langgraph` 1.7.0, `@copilotkit/sdk-js` 1.85.0), Node 26.7.0, Windows 11. Docs: https://docs.copilotkit.ai/vue/langgraph-typescript (snapshot 2026-11-05)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Quickstart](https://docs.copilotkit.ai/vue/langgraph-typescript/quickstart)
**#2 The rendered Vue quickstart page has no Vue quickstart on it.**
- **Doc:** https://docs.copilotkit.ai/vue/langgraph-typescript/quickstart answers `307` and lands on `/vue/langgraph-typescript` (title "Vue quickstart").
- **Result:** in a browser the page shows the LangGraph landing content: "Bring your LangGraph agents into any app", "LangGraph and CopilotKit running together, in the React frontend.", "Build with LangGraph", "Start building", and "Connect your agent" with a Next.js route (`createCopilotRuntimeHandler`, `export const GET = handler; export const POST = handler; …`). There's no `npm create vue`, no `@copilotkit/vue` and no `server.ts`. Its embedded live demo (`showcase-langgraph-typescript-production.up.railway.app/vue/agentic-chat`) returns `404`. Same defect as Antigravity-vue #9. Seen in `LANGGRAPH-vue-01-Quickstart`.

### [Sub-Agents](https://docs.copilotkit.ai/vue/langgraph-typescript/multi-agent/subagents)
**#7 The Vue Sub-Agents page has no Vue frontend code, only React.**
- **Doc:** "Rendering a live delegation log" says "On the frontend, the delegation log is a reactive render of the `delegations` slot." and shows nothing for Vue. The page's Code tab has the agent (`src/agent/subagents.ts`, ends with `export const graph = createGraph();`) and only React/Next frontend files (`page.tsx`, `delegation-log.tsx`): no `.vue` file, no Vue composable. The demo iframe is the React showcase (`/demos/subagents`).
- **Result:** the agent side can be built from the Code tab (`agent/src/subagents.codetab.ts`, `openai-headers.ts` stubbed: imported but not shown), but no Vue route can be implemented from this page. Seen in `LANGGRAPH-vue-04-SubAgents`.

### [WebMCP](https://docs.copilotkit.ai/vue/langgraph-typescript/webmcp)
**#6 The tool handler calls `searchOrders`, which the page never defines, so the agent never replies.**
- **Doc:** `OrderSearch.vue` registers `useFrontendTool({ name: "searchOrders", … handler: async ({ status }) => { const orders = await searchOrders(status); return JSON.stringify(orders); } })`. `searchOrders` is never defined, imported or described on the page. `OrderSearch.vue` also has no `<template>` (Vue warn).
- **Result:** with the verbatim component inside the quickstart provider, "Use the searchOrders tool to find my open orders." gets no reply and no error: the chat just stops (probe 2026-11-09, 94 s, no console errors, no failed requests). Seen in `LANGGRAPH-vue-05-WebMCP`.
- **Confirmed by harness:** with an invented in-memory `searchOrders` (HARNESS copy `OrderSearch.harness.vue`, route `/webmcp-harness`) the agent lists the open orders. The order data has to be made up, so the reader is left guessing.

## Minor notes
- #3 Frontend Tools: `runtime-url="/api/copilotkit"` is relative, but the quickstart runtime is a separate server (`http://localhost:8200`) and Vite has no proxy, so every run 404s (`Runtime info request failed with status 404`). With the absolute URL the tool works (HARNESS route `/frontend-tools-builtin`).
- #4 Frontend Tools: with a LangGraph agent the tool is only called if the graph binds `convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? [])`; the page shows no agent-side code (route `/frontend-tools-lgtools` confirms it).
- #8 Sub-Agents: the warning callout says "Give every delegation a stable `id` and merge new entries by that `id` … a slot that blindly appends … the log doubles when a thread is continued", but the published reducer is a blind append: `reducer: (a, b) => [...(a ?? []), ...(b ?? [])]`.
- #10 The rendered quickstart/landing page links to `/langgraph/build-with-agents` and `/langgraph/quickstart`, which redirect to the **Python** track (`/langgraph-python/...`).
- #11 `zod` (Frontend Tools, WebMCP) and `@copilotkit/core` (WebMCP `webmcp.ts`) are imported, but no Vue install step adds them. They resolve only transitively (3.25.76, 1.85.0).

## Build-only (`vue-tsc` / `vite build`; `npm run dev` runs fine)
- #13 `vue-tsc --build`: `src/webmcp.ts(13,30): error TS2304: Cannot find name 'searchOrders'.` (the core-only WebMCP snippet; rechecked 2026-11-11). The `OrderSearch.vue` error belongs to dev blocker #6.
