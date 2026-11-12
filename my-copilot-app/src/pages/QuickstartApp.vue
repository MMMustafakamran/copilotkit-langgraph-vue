<script setup lang="ts">
import { CopilotKitProvider, CopilotChat } from "@copilotkit/vue/v2"; // [!code highlight]
</script>

<template>
  <!-- [!code highlight:8] -->
  <!-- HARNESS: port 8150 (doc: 8200; server.ts honours PORT, App.vue has no override) -->
  <CopilotKitProvider
    runtime-url="http://localhost:8150/api/copilotkit"
  >
    <div style="height: 100vh">
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
