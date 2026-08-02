import { NextResponse } from "next/server";
import { getLogs } from "@/lib/logs";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET() {
  const isAuth = (await cookies()).get("auth")?.value === "true";
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await getLogs();
  return NextResponse.json(logs);
}
