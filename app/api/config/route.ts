import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAIConfig, saveAIConfig } from "@/lib/config";

export async function GET() {
  const isAuth = (await cookies()).get("auth")?.value === "true";
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getAIConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const isAuth = (await cookies()).get("auth")?.value === "true";
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await request.json();
    if (config.baseUrl) {
      config.baseUrl = config.baseUrl.replace(/\/chat\/completions\/?$/, "").replace(/\/+$/, "");
    }
    await saveAIConfig(config);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
