<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DashboardAgent from "../components/DashboardAgent.vue";
</script>

<template>
  <!-- HARNESS: doc has runtime-url="/api/copilotkit" (404 on Vite, FINDINGS.md). Absolute URL to server.langgraph.ts (8153, GRAPH_ID=frontend_tools_harness on agent/ = doc frontend-tools.ts minus temperature; 8152 is the agent server itself) to check the tool against a LangGraph agent. -->
  <CopilotKitProvider runtime-url="http://localhost:8153/api/copilotkit">
    <DashboardAgent />
  </CopilotKitProvider>
</template>
