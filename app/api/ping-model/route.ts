import { NextResponse } from "next/server";
import { getAIConfig } from "@/lib/config";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

async function pingOpenAI(apiKey: string, baseUrl: string, modelName: string) {
  const url = baseUrl.replace(/\/+$/, ""); // remove trailing slashes
  const res = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://openreview.vercel.app",
      "X-Title": "OpenReview Bot",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: "Hello! Please reply with a short greeting." }],
    }),
  });
  
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Status ${res.status} | Invalid JSON from server:\n${text.substring(0, 500)}`);
  }

  if (!res.ok || data.error) {
    throw new Error(`Status ${res.status} | Error:\n${JSON.stringify(data.error || data, null, 2)}`);
  }
  return data.choices?.[0]?.message?.content || JSON.stringify(data);
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
  
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Status ${res.status} | Invalid JSON from server:\n${text.substring(0, 500)}`);
  }

  if (!res.ok || data.error) {
    throw new Error(`Status ${res.status} | Error:\n${JSON.stringify(data.error || data, null, 2)}`);
  }
  return data.content?.[0]?.text || JSON.stringify(data);
}

export async function POST() {
  const isAuth = (await cookies()).get("auth")?.value === "true";
  if (!isAuth) {
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
