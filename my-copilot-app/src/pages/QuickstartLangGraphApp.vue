<script setup lang="ts">
import { CopilotKitProvider, CopilotChat } from "@copilotkit/vue/v2"; // [!code highlight]
</script>

<template>
  <!-- [!code highlight:8] -->
  <!-- HARNESS: same doc App.vue, pointed at server.langgraph.ts (8151) to check the Vue frontend against a real LangGraph agent -->
  <CopilotKitProvider
    runtime-url="http://localhost:8151/api/copilotkit"
  >
    <div style="height: 100vh">
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
