import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getBot } from "@/lib/bot";
import { addLog } from "@/lib/logs";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const bot = await getBot();
    const handler = bot.webhooks.github;

    if (!handler) {
      return NextResponse.json(
        { error: "GitHub adapter not configured" },
        { status: 404 }
      );
    }

    return handler(request, {
      waitUntil: (task) => after(() => task),
    }) as Promise<NextResponse>;
  } catch (error: any) {
    console.error("Webhook fatal error:", error);
    await addLog("Webhook System", 0, "error", `Fatal Error: ${error.message}`);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
};
