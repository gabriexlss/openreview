import "server-only";
import type { GitHubRawMessage } from "@chat-adapter/github";
import { createGitHubAdapter } from "@chat-adapter/github";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { Chat, emoji } from "chat";
import type { Message, Thread } from "chat";
import { start } from "workflow/api";

import { env } from "@/lib/env";
import { botWorkflow } from "@/workflow";
import type { ThreadMessage, WorkflowParams } from "@/workflow";
import { getAIConfig } from "@/lib/config";

import { getAppInfo, getInstallationOctokit } from "./github";
import { addLog, updateLog } from "./logs";

const collectMessages = async (
  thread: Thread<unknown, unknown>
): Promise<ThreadMessage[]> => {
  const messages: ThreadMessage[] = [];

  for await (const msg of thread.allMessages) {
    messages.push({
      content: msg.text,
      role: msg.author.isMe ? "assistant" : "user",
    });
  }

  return messages;
};

interface ThreadState {
  baseBranch: string;
  prBranch: string;
  prNumber: number;
  repoFullName: string;
}

const state = env.REDIS_URL
  ? createRedisState({ url: env.REDIS_URL })
  : createMemoryState();

let botInstance: Chat | null = null;

const handleMention = async (thread: Thread, message: Message) => {
  await thread.adapter.addReaction(thread.id, message.id, emoji.eyes);

  const messages = await collectMessages(thread);
  const raw = message.raw as GitHubRawMessage;

  const repoFullName = raw.repository.full_name;
  const { prNumber } = raw;

  const octokit = await getInstallationOctokit();
  const [owner, repo] = repoFullName.split("/");

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    pull_number: prNumber,
    repo,
  });

  await thread.setState({
    baseBranch: pr.base.ref,
    prBranch: pr.head.ref,
    prNumber,
    repoFullName,
  } satisfies ThreadState);

  const aiConfig = await getAIConfig();
  
  const logId = await addLog(repoFullName, prNumber, "started", "Review requested via mention");

  try {
    await start(botWorkflow, [
      {
        baseBranch: pr.base.ref,
        messages,
        prBranch: pr.head.ref,
        prNumber,
        repoFullName,
        threadId: thread.id,
        config: aiConfig,
      } satisfies WorkflowParams,
    ]);
    if (logId) await updateLog(logId, "success", "Workflow started successfully");
  } catch (error: any) {
    console.error("Workflow failed to start:", error);
    if (logId) await updateLog(logId, "error", error.message || "Failed to start workflow");
  }
};

const initBot = async (): Promise<Chat> => {
  if (botInstance) {
    return botInstance;
  }

  if (
    !env.GITHUB_APP_ID ||
    !env.GITHUB_APP_INSTALLATION_ID ||
    !env.GITHUB_APP_PRIVATE_KEY ||
    !env.GITHUB_APP_WEBHOOK_SECRET
  ) {
    throw new Error("Missing required GitHub App environment variables");
  }

  const appInfo = await getAppInfo();

  botInstance = new Chat({
    adapters: {
      github: createGitHubAdapter({
        appId: env.GITHUB_APP_ID,
        botUserId: appInfo.botUserId,
        installationId: env.GITHUB_APP_INSTALLATION_ID,
        privateKey: env.GITHUB_APP_PRIVATE_KEY.replaceAll("\\n", "\n"),
        userName: appInfo.slug,
        webhookSecret: env.GITHUB_APP_WEBHOOK_SECRET,
      }),
    },
    logger: "debug",
    state,
    userName: appInfo.slug,
  });

  botInstance.onNewMention(handleMention);

  botInstance.onSubscribedMessage(async (thread, message) => {
    await addLog("Message Parsed", 0, message.isMention ? "success" : "error", `Msg: ${message.text.substring(0,20)} | isMention: ${message.isMention}`);
    if (!message.isMention) {
      return;
    }

    await handleMention(thread, message);
  });

  botInstance.onReaction([emoji.thumbs_up, emoji.heart], async (event) => {
    if (!event.added || !event.message?.author.isMe) {
      return;
    }

    const threadState = (await event.thread.state) as ThreadState | null;

    if (!threadState) {
      return;
    }

    const messages = await collectMessages(event.thread);

    const aiConfig = await getAIConfig();
    
    const logId = await addLog(threadState.repoFullName, threadState.prNumber, "started", "Review requested via reaction");

    try {
      await start(botWorkflow, [
        {
          ...threadState,
          messages,
          threadId: event.thread.id,
          config: aiConfig,
        } satisfies WorkflowParams,
      ]);
      if (logId) await updateLog(logId, "success", "Workflow started successfully");
    } catch (error: any) {
      if (logId) await updateLog(logId, "error", error.message || "Failed to start workflow");
    }
  });

  botInstance.onReaction([emoji.thumbs_down, emoji.confused], async (event) => {
    if (!event.added || !event.message?.author.isMe) {
      return;
    }

    await event.thread.post(
      `${emoji.eyes} Got it, skipping that. Mention me with feedback if you'd like a different approach.`
    );
  });

  return botInstance;
};

export const getBot = (): Promise<Chat> => initBot();
