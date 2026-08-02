import { NextResponse } from "next/server";
import { getLogs } from "@/lib/logs";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET() {
  const auth = (await cookies()).get("auth_token")?.value;
  if (!auth || auth !== env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await getLogs();
  return NextResponse.json(logs);
}
