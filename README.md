# LangGraph-vue: CopilotKit docs QA (LangGraph JS, Vue)

QA harness for the CopilotKit Vue docs at https://docs.copilotkit.ai/vue/langgraph-typescript. Every doc page gets a route in a real Vite + Vue app with the doc's snippets pasted **verbatim**, and a screen-recorded clip shows what happens when a user follows the page. Where the docs break, the clip shows the break and the defect is listed in [FINDINGS.md](FINDINGS.md). Nothing here fixes a doc defect; the only allowed edits are marked `HARNESS` (rules: `.qa/instructions/QA-RULES.md`).

Status: recorded 2026-11-05, findings logged. 5 pages tracked in [assignment.json](assignment.json), 4 reachable (all ❌; Chat Components is marked `reachable: none` and kept out of the report), 4 clips, all on Loom. Current report: [report/status.html](report/status.html).

## Layout

```
agent/                   own LangGraph JS agent server (langgraph.json), `langgraphjs dev` on 8152
my-copilot-app/          Vite + Vue app, one route per doc page; runtimes server.ts / server.langgraph.ts
doc-snapshot/            rendered / .md snapshot of the docs (2026-11-05)
autorecorder/            clip recorder: cli.ts → core/engine.ts → actions/*.ts; config/*.config.ts; output videos/ (not committed)
tools/                   helper scripts (doc render, frames, smoke, SSE checks)
assignment.json          per-page status, notes, findings, clip ids, Loom links
report/status.html       generated from assignment.json (paste-friendly, team Google Doc format)
FINDINGS.md              open doc defects (stable #N ids; React-side ones are cited as React #N)
.qa/                     vendored shared tooling + rules (synced; don't edit here)
start-all.sh             starts the agent server, runtimes and Vite on the harness ports (see Run)
```

## Run

This repo runs on its own: it has its own LangGraph JS agent server in `agent/` and does not need LangGraph-react.

Prerequisites: Node.js 20+, Git Bash (or any bash), `curl`.

1. Keys: copy `.env.example` and fill in `OPENAI_API_KEY` in **both** `agent/.env` and `my-copilot-app/.env` (both gitignored).
2. Install: `cd agent && npm ci`, then `cd ../my-copilot-app && npm ci`.
3. Start everything: `./start-all.sh` (logs in `logs/`). It starts, in order:

| Port | Server |
|---|---|
| 8152 | `agent/`: `langgraphjs dev` serving `sample_agent`, `frontend_tools`, `frontend_tools_harness` (`agent/langgraph.json`) |
| 8150 | `my-copilot-app/server.ts`: the doc's runtime (BuiltInAgent) |
| 8151 | `my-copilot-app/server.langgraph.ts`: LangGraphAgent -> `sample_agent` |
| 8153 | `server.langgraph.ts` with `GRAPH_ID=frontend_tools_harness` (route `/frontend-tools-lgtools`) |
| 5150 | Vite app: http://localhost:5150 |

Notes:
- `langgraphjs dev` binds IPv6 `::1` only. Use `http://localhost:8152`, not `127.0.0.1`.
- Point the runtimes at another LangGraph server with `LANGGRAPH_DEPLOYMENT_URL=... ./start-all.sh`.
- Never run on 3000 / 8000.
- Agent code in `agent/src/` is copied verbatim from the docs (via LangGraph-react). `agent/src/subagents.ts` is the Sub-Agents page's snippet; it exports no graph (FINDINGS.md), so it isn't registered.
- Record clips: `cd autorecorder && npm run record` (see `autorecorder/`).

## How to review and report

- **A clip**: it should go doc → IDE (verbatim code) → demo, and for ❌/⚠️ also evidence (the faulty doc text drag-selected) → Notepad note. Nothing may be injected on the page.
- **A status**: ✅ works as documented, ⚠️ main feature works with a minor defect, ❌ main feature doesn't work as documented. If in doubt, ❌.
- **A finding**: add it to `FINDINGS.md` with its evidence (probe result, error text, frame). Format: QA-RULES section 5.
- **The report**: edit `assignment.json` (schema: `.qa/report/SCHEMA.md`), then rebuild. Don't hand-edit the HTML.

  ```sh
  python .qa/report/build.py assignment.json --out report/status.html
  # framework report for the team doc (React file first; needs a checkout of LangGraph-react beside this repo)
  python .qa/report/build.py ../LangGraph-react/assignment.json assignment.json --out LangGraph-testing-doc.html
  ```
