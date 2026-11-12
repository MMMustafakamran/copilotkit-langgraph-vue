<script setup lang="ts">
// HARNESS: same as WebMcpApp.vue, with the OrderSearch copy that defines searchOrders (FINDINGS.md #6, minor).
import { CopilotKitProvider, CopilotChat } from "@copilotkit/vue/v2";
import OrderSearch from "../components/OrderSearch.harness.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="http://localhost:8150/api/copilotkit">
    <OrderSearch />
    <div style="height: 90vh">
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
