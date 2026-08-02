import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getBot } from "@/lib/bot";
import { addLog } from "@/lib/logs";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const eventType = request.headers.get("x-github-event") || "unknown";
    if (eventType !== "ping") {
      const clonedReq = request.clone();
      const body = await clonedReq.json();
      const instId = body?.installation?.id || "N/A";
      await addLog("Webhook Received", 0, "started", `Event: ${eventType} | Install ID: ${instId}`);
    }

    const bot = await getBot();
    const handler = bot.webhooks.github;

    if (!handler) {
      return NextResponse.json(
        { error: "GitHub adapter not configured" },
        { status: 404 }
      );
    }

    const tasks: Promise<any>[] = [];
    const response = await handler(request, {
      waitUntil: (task) => tasks.push(task),
    });
    
    await Promise.all(tasks);
    return response as NextResponse;
  } catch (error: any) {
    console.error("Webhook fatal error:", error);
    await addLog("Webhook System", 0, "error", `Fatal Error: ${error.message}`);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
};
