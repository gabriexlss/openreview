export interface AIConfig {
  provider: "anthropic" | "openrouter" | "custom";
  apiKey: string;
  baseUrl: string;
  modelName: string;
}
