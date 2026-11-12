<script setup lang="ts">
// HARNESS: one Vite app, one root per doc page, chosen by path (the docs' main.ts mounts ./App.vue).
import QuickstartApp from "./pages/QuickstartApp.vue";
import QuickstartLangGraphApp from "./pages/QuickstartLangGraphApp.vue";
import FrontendToolsApp from "./pages/FrontendToolsApp.vue";
import ChatComponentsApp from "./pages/ChatComponentsApp.vue";
import WebMcpApp from "./pages/WebMcpApp.vue";
import SubagentsApp from "./pages/SubagentsApp.vue";
import FrontendToolsLgToolsApp from "./pages/FrontendToolsLgToolsApp.vue";
import FrontendToolsBuiltinApp from "./pages/FrontendToolsBuiltinApp.vue";
import FrontendToolsHarnessApp from "./pages/FrontendToolsHarnessApp.vue";
import WebMcpHarnessApp from "./pages/WebMcpHarnessApp.vue";
const routes: Record<string, unknown> = {
  "/": QuickstartApp,
  "/quickstart-langgraph": QuickstartLangGraphApp,
  "/frontend-tools": FrontendToolsApp,
  "/agentic-chat-ui": ChatComponentsApp,
  "/webmcp": WebMcpApp,
  "/subagents": SubagentsApp,
  "/frontend-tools-lgtools": FrontendToolsLgToolsApp,
  "/frontend-tools-builtin": FrontendToolsBuiltinApp,
  "/frontend-tools-harness": FrontendToolsHarnessApp,
  "/webmcp-harness": WebMcpHarnessApp, // HARNESS: searchOrders defined
};
const Root = routes[location.pathname.replace(/\/$/, "") || "/"] ?? QuickstartApp;
</script>
<template><component :is="Root" /></template>
