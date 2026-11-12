// HARNESS: no Vue page shows how to register a LangGraph agent (was FINDINGS.md #1, removed 2026-11-11: the Vue steps are only in the .md export). This is the quickstart
// server.ts with BuiltInAgent replaced by the LangGraphAgent wiring from the rendered landing page
// (https://docs.copilotkit.ai/vue/langgraph-typescript, "Connect your agent"), pointed at
// this repo's own LangGraph JS server (../agent, `langgraphjs dev` on :8152, graph sample_agent). Port 8151 (doc: 8200).
import { createServer } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8152", // HARNESS: default = own agent/ server on 8152 (doc: LANGGRAPH_DEPLOYMENT_URL!, no default); "localhost", not 127.0.0.1 (langgraphjs dev binds ::1)
      graphId: process.env.GRAPH_ID ?? "sample_agent", // HARNESS: GRAPH_ID=frontend_tools_harness for the tool check
    }),
  },
});

const port = Number(process.env.PORT ?? 8151);
createServer(createCopilotNodeListener({ runtime, basePath: "/api/copilotkit", cors: true })).listen(port, () => {
  console.log(`Copilot Runtime (LangGraph) listening at http://localhost:${port}/api/copilotkit`);
});
