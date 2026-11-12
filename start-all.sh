#!/usr/bin/env bash
# HARNESS: starts every LangGraph-vue server on its harness ports (REPOS.md: never 3000/8000).
#   8152 own LangGraph JS API server (agent/, `langgraphjs dev`; doc default 8123, `--port` override).
#        Binds IPv6 ::1 only, so clients must use "localhost", not 127.0.0.1.
#   8150 doc runtime server.ts (BuiltInAgent; doc: 8200, server.ts honours PORT)
#   8151 server.langgraph.ts (LangGraphAgent -> sample_agent on :8152, harness check; old #1 removed 2026-11-11)
#   8153 server.langgraph.ts with GRAPH_ID=frontend_tools_harness (route /frontend-tools-lgtools)
#   5150 Vite (doc: 5173)
# Override the agent URL with LANGGRAPH_DEPLOYMENT_URL. Keys: agent/.env and my-copilot-app/.env (see .env.example).
cd "$(dirname "$0")"
mkdir -p logs
: "${LANGGRAPH_DEPLOYMENT_URL:=http://localhost:8152}"
export LANGGRAPH_DEPLOYMENT_URL

# 1. agent backend
(cd agent && npx @langchain/langgraph-cli dev --port 8152 --no-browser > ../logs/agent-8152.log 2>&1) &
echo "waiting for the LangGraph server on $LANGGRAPH_DEPLOYMENT_URL ..."
for _ in $(seq 1 90); do
  curl -sf "$LANGGRAPH_DEPLOYMENT_URL/ok" > /dev/null 2>&1 && break
  sleep 2
done

# 2. runtimes, 3. Vite
cd my-copilot-app
set -a; . ./.env; set +a
(PORT=8150 npx tsx server.ts > ../logs/runtime-8150.log 2>&1) &
(PORT=8151 npx tsx server.langgraph.ts > ../logs/runtime-8151.log 2>&1) &
(PORT=8153 GRAPH_ID=frontend_tools_harness npx tsx server.langgraph.ts > ../logs/runtime-8153.log 2>&1) &
(npm run dev > ../logs/vite-5150.log 2>&1) &
wait
