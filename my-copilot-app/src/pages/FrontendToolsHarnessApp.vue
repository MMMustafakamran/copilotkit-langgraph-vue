<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DashboardAgent from "../components/DashboardAgent.vue";
</script>

<template>
  <!-- HARNESS: doc has runtime-url="/api/copilotkit" (404 on Vite, FINDINGS.md). Absolute URL to server.langgraph.ts (8151, LangGraph sample_agent) to check the tool against a LangGraph agent. -->
  <CopilotKitProvider runtime-url="http://localhost:8151/api/copilotkit">
    <DashboardAgent />
  </CopilotKitProvider>
</template>
