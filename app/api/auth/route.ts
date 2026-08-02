import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = env.DASHBOARD_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";

  if (password === adminPassword) {
    (await cookies()).set("auth", "true", { httpOnly: true, path: "/" });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}
