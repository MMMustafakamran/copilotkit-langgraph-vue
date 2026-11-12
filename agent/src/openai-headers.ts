// HARNESS: openai-headers.ts imported by the Code tab's subagents.ts but not shown on the page.
// Minimal stand-in: builds a ChatOpenAI with the given options (header forwarding left out).
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI, type ChatOpenAIFields } from "@langchain/openai";

export function makeChatOpenAI(_config: RunnableConfig | undefined, fields: ChatOpenAIFields): ChatOpenAI {
  return new ChatOpenAI(fields);
}
