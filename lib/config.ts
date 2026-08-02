import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AIConfig } from "./config-types";

const configPath = join(process.cwd(), "data", "ai-config.json");

const defaultConfig: AIConfig = {
  provider: "anthropic",
  apiKey: "",
  baseUrl: "",
  modelName: "claude-3-7-sonnet-20250219",
};

export async function getAIConfig(): Promise<AIConfig> {
  if (!existsSync(configPath)) {
    return defaultConfig;
  }
  try {
    const content = await readFile(configPath, "utf-8");
    return { ...defaultConfig, ...JSON.parse(content) };
  } catch (err) {
    console.error("Failed to read AI config", err);
    return defaultConfig;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}
