<script setup lang="ts">
// HARNESS: the doc never shows where useAgenticChatSuggestions() is called; it is called here, in setup.
import { useAgenticChatSuggestions } from "../app/demos/agentic-chat/suggestions";
useAgenticChatSuggestions();
</script>

<template>
  <!-- Doc snippet "src/app/demos/agentic-chat/page.tsx", verbatim inside a Vue template (it is React JSX). -->
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agentic_chat">
      <Chat />
    </CopilotKit>
</template>
