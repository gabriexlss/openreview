import { NextResponse } from "next/server";
import { getAIConfig } from "@/lib/config";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

async function pingOpenAI(apiKey: string, baseUrl: string, modelName: string) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: "Hello! Please reply with a short greeting." }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

async function pingAnthropic(apiKey: string, modelName: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello! Please reply with a short greeting." }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

export async function POST() {
  const auth = (await cookies()).get("auth_token")?.value;
  if (!auth || auth !== env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getAIConfig();
    let responseText = "";

    if (config.provider === "openrouter" || config.provider === "custom") {
      responseText = await pingOpenAI(
        config.apiKey,
        config.baseUrl || "https://openrouter.ai/api/v1",
        config.modelName || "openai/gpt-4o"
      );
    } else if (config.provider === "anthropic") {
      responseText = await pingAnthropic(
        config.apiKey,
        config.modelName || "claude-3-7-sonnet-20250219"
      );
    } else {
      throw new Error("Invalid provider");
    }

    return NextResponse.json({ response: responseText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
