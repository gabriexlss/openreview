import { neon } from "@neondatabase/serverless";
import type { AIConfig } from "./config-types";

const defaultConfig: AIConfig = {
  provider: "anthropic",
  apiKey: "",
  baseUrl: "",
  modelName: "claude-3-7-sonnet-20250219",
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getCryptoKey() {
  const secret = process.env.ENCRYPTION_KEY || "default_secret_key_32_bytes_long.";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text: string): Promise<string> {
  if (!text) return text;
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(cipher)}`;
}

async function decrypt(text: string): Promise<string> {
  if (!text || !text.includes(":")) return text;
  const key = await getCryptoKey();
  const [ivB64, cipherB64] = text.split(":");
  const iv = base64ToArrayBuffer(ivB64);
  const cipher = base64ToArrayBuffer(cipherB64);
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch (e) {
    console.error("Decryption failed", e);
    return "";
  }
}

export async function getAIConfig(): Promise<AIConfig> {
  if (!process.env.DATABASE_URL) {
    return defaultConfig;
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT provider, api_key, base_url, model_name FROM ai_config WHERE id = 1`;
    if (rows.length === 0) {
      return defaultConfig;
    }
    
    const row = rows[0];
    const apiKey = await decrypt(row.api_key || "");
    
    return {
      provider: row.provider as any,
      apiKey: apiKey,
      baseUrl: row.base_url || "",
      modelName: row.model_name || "",
    };
  } catch (err) {
    console.error("Failed to read AI config from DB", err);
    return defaultConfig;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  
  const sql = neon(process.env.DATABASE_URL);
  const encryptedKey = await encrypt(config.apiKey);
  
  await sql`
    INSERT INTO ai_config (id, provider, api_key, base_url, model_name)
    VALUES (1, ${config.provider}, ${encryptedKey}, ${config.baseUrl || null}, ${config.modelName || null})
    ON CONFLICT (id) DO UPDATE SET 
      provider = EXCLUDED.provider,
      api_key = EXCLUDED.api_key,
      base_url = EXCLUDED.base_url,
      model_name = EXCLUDED.model_name,
      updated_at = CURRENT_TIMESTAMP
  `;
}
