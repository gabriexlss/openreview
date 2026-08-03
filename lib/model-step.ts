import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { AIConfig } from "@/lib/config-types";

export function getModel(config: AIConfig) {
  return async () => {
    "use step";
    if (config.provider === "openrouter" || config.provider === "custom") {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || (config.provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined),
      });
      return openai(config.modelName || "gpt-4o-mini");
    } else if (config.provider === "anthropic" && config.apiKey) {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
      });
      return anthropic(config.modelName || "claude-3-5-sonnet-latest");
    }
    
    // fallback
    const openai = createOpenAI({ apiKey: "none" });
    return openai("fallback");
  };
}
