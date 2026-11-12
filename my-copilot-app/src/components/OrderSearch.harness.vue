<script setup lang="ts">
// HARNESS copy of OrderSearch.vue (verbatim except the helper below). The doc calls searchOrders(status)
// but never defines it (FINDINGS.md #6, minor). Obvious stand-in: a small in-memory order list.
import { z } from "zod";
import { useFrontendTool } from "@copilotkit/vue/v2";

// HARNESS: the missing helper.
const ORDERS = [
  { id: "A-1001", status: "open", item: "Running shoes" },
  { id: "A-1002", status: "shipped", item: "Water bottle" },
  { id: "A-1003", status: "open", item: "Rain jacket" },
  { id: "A-1004", status: "delivered", item: "Yoga mat" },
];
async function searchOrders(status: string) {
  return ORDERS.filter((o) => o.status === status);
}

useFrontendTool({
  name: "searchOrders",
  description: "Search the signed-in user's orders by status",
  parameters: z.object({
    status: z.enum(["open", "shipped", "delivered"]),
  }),
  handler: async ({ status }) => {
    const orders = await searchOrders(status);
    return JSON.stringify(orders);
  },
  webmcp: {
    annotations: {
      readOnlyHint: true,
    },
  },
});
</script>
