<script setup lang="ts">
// HARNESS: the doc says OrderSearch "must run inside your existing CopilotKitProvider"; this is the
// quickstart provider (runtime on 8150) plus a chat so the CopilotKit agent can call the tool too.
import { CopilotKitProvider, CopilotChat } from "@copilotkit/vue/v2";
import OrderSearch from "../components/OrderSearch.vue";
// HARNESS: probe so the clip shows whether the browser exposes WebMCP at all.
const hasModelContext = typeof (document as any).modelContext !== "undefined";
</script>

<template>
  <CopilotKitProvider runtime-url="http://localhost:8150/api/copilotkit">
    <OrderSearch />
    <p data-testid="webmcp-probe">document.modelContext available: {{ hasModelContext }}</p>
    <div style="height: 90vh">
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
