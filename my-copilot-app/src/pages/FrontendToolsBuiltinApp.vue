<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DashboardAgent from "../components/DashboardAgent.vue";
</script>

<template>
  <!-- HARNESS: the doc has runtime-url="/api/copilotkit", which 404s on Vite (FINDINGS.md #3, minor). Only change: the quickstart runtime's absolute URL (doc server.ts on 8150). -->
  <CopilotKitProvider runtime-url="http://localhost:8150/api/copilotkit">
    <DashboardAgent />
  </CopilotKitProvider>
</template>
