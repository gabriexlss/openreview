import { NextResponse } from "next/server";
import { getInstallationOctokit, getAppInfo } from "@/lib/github";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const auth = (await cookies()).get("auth_token")?.value;
  if (!auth || auth !== env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoFullName, prNumber } = await req.json();
  if (!repoFullName || !prNumber) {
    return NextResponse.json({ error: "Missing repoFullName or prNumber" }, { status: 400 });
  }
  const [owner, repo] = repoFullName.split("/");

  try {
    const octokit = await getInstallationOctokit();
    const appInfo = await getAppInfo();
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: Number(prNumber),
      body: `@${appInfo.slug} please review this PR`,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
