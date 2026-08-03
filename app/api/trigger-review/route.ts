import { NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/github";
import { cookies } from "next/headers";
import { start } from "workflow/api";
import { botWorkflow } from "@/workflow";
import type { WorkflowParams } from "@/workflow";
import { getAIConfig } from "@/lib/config";
import { addLog, updateLog } from "@/lib/logs";

export async function POST(req: Request) {
  const isAuth = (await cookies()).get("auth")?.value === "true";
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoFullName, prNumber } = await req.json();
  if (!repoFullName || !prNumber) {
    return NextResponse.json({ error: "Missing repoFullName or prNumber" }, { status: 400 });
  }
  const [owner, repo] = repoFullName.split("/");

  try {
    const octokit = await getInstallationOctokit();
    
    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json({ error: "Upstash QSTASH_TOKEN is missing in Vercel environment variables. Workflows cannot run in production without it." }, { status: 500 });
    }

    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      pull_number: Number(prNumber),
      repo,
    });

    const aiConfig = await getAIConfig();
    const logId = await addLog(repoFullName, Number(prNumber), "started", "Review requested manually via dashboard");
    
    const workflowResult = await start(botWorkflow, [
      {
        baseBranch: pr.base.ref,
        messages: [{ role: "user", content: "Please review this PR." }],
        prBranch: pr.head.ref,
        prNumber: Number(prNumber),
        repoFullName,
        threadId: pr.node_id,
        config: aiConfig,
      } satisfies WorkflowParams,
    ]);
    
    if (logId) await updateLog(logId, "success", "Workflow started successfully");
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
